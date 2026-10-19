/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft,
    Search,
    AlertCircle,
    ChevronsUpDown,
    ChevronsRight,
    ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types
export type SortDirection = "asc" | "desc" | "none";

export interface DataTableColumn<T> {
    key: string;
    header: React.ReactNode;
    cell: (item: T, index: number) => React.ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    filterOptions?: Array<{ key: string; value: string }>;
    width?: string;
    align?: "left" | "center" | "right";
    fixed?: "left" | "right";
}

export interface DataTableProps<T> {
    // Core data props
    data?: T[];
    columns: DataTableColumn<T>[];
    keyExtractor: (item: T) => string;

    // Loading and error states
    isLoading?: boolean;
    error?: string;

    // Pagination options
    pagination?: {
        pageSize?: number;
        pageSizeOptions?: number[];
        showSizeChanger?: boolean;
        total?: number;
        serverSide?: boolean;
        infiniteScroll?: boolean;
        position?: "top" | "bottom" | "both";
        onPageChange?: (page: number) => void;
        onPageSizeChange?: (pageSize: number) => void;
    };

    // Selection options
    selectable?: boolean;
    onSelectionChange?: (selectedItems: T[]) => void;
    onSelectionIdsChange?: (selectedIds: string[]) => void; // Add this new prop

    // Expandable rows
    expandable?: boolean;
    renderExpandedRow?: (item: T) => React.ReactNode;

    // Search options
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    searchQuery?: string;

    // Advanced filtering
    showColumnFilters?: boolean;
    onFilter?: (filters: Record<string, string>) => void;
    onSort?: (column: string, direction: SortDirection) => void;

    // General
    className?: string;
    rowClassName?: string | ((item: T, index: number) => string);
    emptyText?: string;

    // Sticky header
    stickyHeader?: boolean;
    stickyHeaderOffset?: number;
}

interface SortOption {
    column: string;
    direction: SortDirection;
}

// Helper functions
const getSortedData = <T,>(data: T[], sortOption: SortOption): T[] => {
    if (sortOption.direction === "none") return data;

    return [...data].sort((a, b) => {
        const aValue = getNestedValue(a, sortOption.column);
        const bValue = getNestedValue(b, sortOption.column);

        if (aValue < bValue) return sortOption.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOption.direction === "asc" ? 1 : -1;
        return 0;
    });
};

const getNestedValue = (obj: any, path: string) => {
    const keys = path.split(".");
    return keys.reduce((acc, key) => {
        return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj);
};

const filterData = <T,>(data: T[], searchQuery: string): T[] => {
    if (!searchQuery) return data;
    const lowercaseQuery = searchQuery.toLowerCase();

    return data.filter((item: T) => {
        if (item === null || item === undefined) return false;

        // If the item is a primitive, compare its string representation
        if (typeof item !== "object") {
            return String(item).toLowerCase().includes(lowercaseQuery);
        }

        // Cast to a plain object for Object.entries to satisfy TypeScript
        const obj = item as Record<string, any>;

        return Object.entries(obj).some(([_, value]) => {
            if (value === null || value === undefined) return false;
            if (typeof value === "object") {
                return Object.values(value).some(
                    (v) =>
                        v !== null &&
                        v !== undefined &&
                        String(v).toLowerCase().includes(lowercaseQuery)
                );
            }
            return String(value).toLowerCase().includes(lowercaseQuery);
        });
    });
};

export function TableSkeleton({
    rows = 5,
    columns = 5,
}: {
    rows?: number;
    columns?: number;
}) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 px-4 py-3">
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton
                            key={`${i}-${j}`}
                            className={j === 0 ? "h-4 w-[80px]" : "h-4 w-full"}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function DataTable<T>({
    data = [],
    columns,
    keyExtractor,
    isLoading = false,
    error,
    pagination = {
        pageSize: 10,
        total: 100,
        pageSizeOptions: [10, 20, 50, 100],
        showSizeChanger: true,
        serverSide: false,
        infiniteScroll: false,
        position: "bottom",
    },
    selectable = false,
    onSelectionChange,
    onSelectionIdsChange,
    expandable = false,
    renderExpandedRow,
    searchable = false,
    searchPlaceholder = "Search...",
    onSearch,
    searchQuery: externalSearchQuery,
    showColumnFilters = false,
    onFilter,
    onSort,
    className,
    rowClassName,
    emptyText = "No results found.",
    stickyHeader = false,
    stickyHeaderOffset = 0,
}: DataTableProps<T>) {
    // State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination.pageSize || 10);
    const [sortOption, setSortOption] = useState<SortOption>({
        column: "",
        direction: "none",
    });
    const [internalSearchQuery, setInternalSearchQuery] = useState(
        externalSearchQuery || ""
    );
    const [selectedItems, setSelectedItems] = useState<T[]>([]);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
        {}
    );

    useEffect(() => {
        if (!selectable || selectedItems.length === 0) return;
        setSelectedItems([]);
        onSelectionChange?.([]);
        onSelectionIdsChange?.([]);
    }, [data]);

    // Debounce function for search
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Reset page when search query changes
    useEffect(() => {
        if (externalSearchQuery !== undefined) {
            setInternalSearchQuery(externalSearchQuery);
            setCurrentPage(1);
        }
    }, [externalSearchQuery]);

    // Notify parent about column filter changes for server-side filtering
    useEffect(() => {
        if (pagination.serverSide && onFilter) {
            onFilter(columnFilters);
        }
    }, [columnFilters, pagination.serverSide, onFilter]);

    // Notify parent about sort changes for server-side sorting
    useEffect(() => {
        if (pagination.serverSide && onSort && sortOption.column) {
            onSort(sortOption.column, sortOption.direction);
        }
    }, [sortOption, pagination.serverSide, onSort]);

    // Derived state for client-side pagination
    const processedData = useMemo(() => {
        // For server-side pagination, use the data as-is since server handles filtering/sorting
        if (pagination.serverSide) return data;

        // For client-side, apply filters and sorting
        let processed = [...data];

        // Apply search filter
        const query = externalSearchQuery || internalSearchQuery;
        if (query) {
            processed = filterData(processed, query);
        }

        // Apply column filters
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (value) {
                processed = processed.filter((item) => {
                    const itemValue = String(getNestedValue(item, key));
                    return itemValue === value;
                });
            }
        });

        // Apply sorting
        if (sortOption.column && sortOption.direction !== "none") {
            processed = getSortedData(processed, sortOption);
        }

        return processed;
    }, [
        pagination.serverSide,
        data,
        externalSearchQuery,
        internalSearchQuery,
        columnFilters,
        sortOption,
    ]);

    // Calculate total items
    const totalItems = pagination.serverSide
        ? pagination.total || 0
        : processedData.length;

    // Calculate paginated data
    const paginatedData = useMemo(() => {
        if (pagination.serverSide) {
            // For server-side, return data as-is since server handles pagination
            return data;
        }

        if (pagination.infiniteScroll) {
            return processedData.slice(0, currentPage * pageSize);
        }

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return processedData.slice(startIndex, endIndex);
    }, [
        processedData,
        currentPage,
        pageSize,
        pagination.serverSide,
        pagination.infiniteScroll,
        data,
    ]);

    // Total pages calculation
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        if (pagination.onPageChange) {
            pagination.onPageChange(page);
        }
    };

    // Handle page size change
    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
        if (pagination.onPageSizeChange) {
            pagination.onPageSizeChange(newSize);
        }
    };

    // Handle sort change
    const handleSortChange = (column: string) => {
        setSortOption((prevSort) => {
            // If clicking the same column
            if (prevSort.column === column) {
                // Cycle through directions: asc -> desc -> none
                if (prevSort.direction === "asc") return { column, direction: "desc" };
                if (prevSort.direction === "desc")
                    return { column: "", direction: "none" };
                return { column, direction: "asc" };
            }
            // If clicking a new column
            return { column, direction: "asc" };
        });

        // Reset to first page when sorting changes
        setCurrentPage(1);
    };

    // Handle search input with debounce
    const debouncedSearch = useCallback(
        debounce((query: string) => {
            setInternalSearchQuery(query);
            setCurrentPage(1);
            if (onSearch) {
                onSearch(query);
            }
        }, 300),
        [onSearch]
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        debouncedSearch(query);
    };

    // Handle selection
    const handleSelectAll = (checked: boolean) => {
        const newSelected = checked ? paginatedData : [];
        setSelectedItems(newSelected);

        // Use setTimeout to defer the callback execution
        setTimeout(() => {
            if (onSelectionChange) {
                onSelectionChange(newSelected);
            }

            if (onSelectionIdsChange) {
                const selectedIds = newSelected.map((item) => keyExtractor(item));
                onSelectionIdsChange(selectedIds);
            }
        }, 0);
    };

    const handleSelectItem = (item: T, checked: boolean) => {
        setSelectedItems((prev) => {
            const newSelected = checked
                ? [...prev, item]
                : prev.filter((i) => keyExtractor(i) !== keyExtractor(item));

            // Use setTimeout to defer the callback execution
            setTimeout(() => {
                if (onSelectionChange) {
                    onSelectionChange(newSelected);
                }

                if (onSelectionIdsChange) {
                    const selectedIds = newSelected.map((selectedItem) =>
                        keyExtractor(selectedItem)
                    );
                    onSelectionIdsChange(selectedIds);
                }
            }, 0);

            return newSelected;
        });
    };

    // Handle row expansion
    const toggleRowExpansion = (key: string) => {
        setExpandedRows((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Handle column filter
    const handleColumnFilter = (column: string, value: string) => {
        setColumnFilters((prev) => ({
            ...prev,
            [column]: value,
        }));
        setCurrentPage(1);
    };

    // Get row class name
    const getRowClassName = (item: T, index: number) => {
        if (typeof rowClassName === "function") {
            return rowClassName(item, index);
        }
        return rowClassName || "";
    };

    // Render loading state
    if (isLoading && data.length === 0) {
        return (
            <div className={cn("space-y-4", className)}>
                {searchable && (
                    <div className="relative flex justify-end w-full">
                        <div className="relative max-w-md w-full">
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                )}
                <TableSkeleton
                    rows={pageSize}
                    columns={columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)}
                />
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <span className="ml-2">{error}</span>
            </div>
        );
    }

    // Calculate display rows
    const displayData = paginatedData;

    // Render pagination controls
    const renderPaginationControls = () => (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </div>

                {pagination.showSizeChanger && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Show</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => handlePageSizeChange(Number(value))}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue placeholder={pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                                {pagination.pageSizeOptions?.map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {!pagination.infiniteScroll && totalPages > 0 && (
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1 || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex flex-col md:flex-row items-center gap-1 mx-2">
                        {(() => {
                            let startPage = 1;
                            let endPage = Math.min(totalPages, 5);

                            if (currentPage > 3) {
                                startPage = Math.max(currentPage - 2, 1);
                                endPage = Math.min(startPage + 4, totalPages);

                                if (endPage - startPage < 4 && startPage > 1) {
                                    startPage = Math.max(endPage - 4, 1);
                                }
                            }

                            const pageNumbers = [];

                            if (startPage > 1) {
                                pageNumbers.push(
                                    <Button
                                        key="start-ellipsis"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(Math.max(startPage - 5, 1))}
                                        disabled={isLoading}
                                        className="h-8 w-8 p-0"
                                    >
                                        ...
                                    </Button>
                                );
                            }

                            for (let i = startPage; i <= endPage; i++) {
                                pageNumbers.push(
                                    <Button
                                        key={i}
                                        variant={i === currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(i)}
                                        disabled={isLoading}
                                        className={cn(
                                            "h-8 w-8 p-0 font-medium",
                                            i === currentPage &&
                                            "bg-green-600 hover:bg-green-700 text-white"
                                        )}
                                    >
                                        {i}
                                    </Button>
                                );
                            }

                            if (endPage < totalPages) {
                                pageNumbers.push(
                                    <Button
                                        key="end-ellipsis"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handlePageChange(Math.min(endPage + 5, totalPages))
                                        }
                                        disabled={isLoading}
                                        className="h-8 w-8 p-0"
                                    >
                                        ...
                                    </Button>
                                );
                            }

                            return pageNumbers;
                        })()}
                        <span className="text-sm text-muted-foreground sm:hidden">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );

    // Render table
    return (
        <div className={cn("space-y-4", className)}>
            {/* Top pagination */}
            {(pagination.position === "top" || pagination.position === "both") &&
                !pagination.infiniteScroll &&
                totalPages > 0 &&
                renderPaginationControls()}

            {/* Search input */}
            {searchable && (
                <div className="relative flex justify-end w-full">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={internalSearchQuery}
                            onChange={handleSearchChange}
                            className="pl-8 w-full"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border grid overflow-x-auto">
                <Table>
                    <TableHeader
                        className={cn(
                            stickyHeader && "sticky top-0 z-10 bg-background",
                            !!stickyHeaderOffset && `top-[${stickyHeaderOffset}px]`
                        )}
                    >
                        <TableRow>
                            {/* Expansion column */}
                            {expandable && <TableHead className="w-8 px-2"></TableHead>}

                            {/* Selection column */}
                            {selectable && (
                                <TableHead className="w-8 px-2">
                                    <Checkbox
                                        checked={
                                            displayData.length > 0 &&
                                            selectedItems.length === displayData.length
                                        }
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                        disabled={isLoading}
                                    />
                                </TableHead>
                            )}

                            {/* Data columns */}
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        column.sortable && "cursor-pointer select-none",
                                        column.width && `w-[${column.width}]`,
                                        column.align === "center" && "text-center",
                                        column.align === "right" && "text-right",
                                        column.fixed === "left" &&
                                        "sticky left-0 z-20 bg-background",
                                        column.fixed === "right" &&
                                        "sticky right-0 z-20 bg-background"
                                    )}
                                    style={column.width ? { width: column.width } : undefined}
                                    onClick={
                                        column.sortable
                                            ? () => handleSortChange(column.key)
                                            : undefined
                                    }
                                >
                                    <div className="flex md:flex-row flex-col items-center gap-x-2 gap-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="whitespace-nowrap">{column.header}</span>
                                            {column.sortable && (
                                                <div className="flex flex-col">
                                                    {sortOption.column === column.key ? (
                                                        sortOption.direction === "asc" ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : sortOption.direction === "desc" ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronsUpDown className="h-4 w-4" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {showColumnFilters &&
                                            column.filterable &&
                                            column.filterOptions && (
                                                <div className="relative inline-block">
                                                    <select
                                                        className="
                          text-xs px-2 py-1.5 pr-7 min-w-[90px]
                          bg-white border border-blue-600 rounded-md
                          text-gray-600 font-normal
                          focus:outline-none focus:border-blue-300 focus:bg-gray-50
                          hover:border-blue-300 hover:bg-gray-50
                          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                          appearance-none cursor-pointer
                          transition-all duration-150 ease-in-out
                        "
                                                        value={columnFilters[column.key] || ""}
                                                        onChange={(e) =>
                                                            handleColumnFilter(column.key, e.target.value)
                                                        }
                                                        onClick={(e) => e.stopPropagation()}
                                                        disabled={isLoading}
                                                    >
                                                        <option value="" className="text-gray-500">
                                                            All
                                                        </option>
                                                        {column.filterOptions.map((option) => (
                                                            <option
                                                                key={option.value}
                                                                value={option.value}
                                                                className="text-gray-600"
                                                            >
                                                                {option.key}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Subtle dropdown arrow */}
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                        <svg
                                                            className="w-3 h-3 text-gray-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={1.5}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            // Loading state within table
                            Array.from({ length: pageSize }).map((_, index) => (
                                <TableRow key={`loading-${index}`}>
                                    {expandable && (
                                        <TableCell className="p-2">
                                            <Skeleton className="h-4 w-4" />
                                        </TableCell>
                                    )}
                                    {selectable && (
                                        <TableCell className="p-2">
                                            <Skeleton className="h-4 w-4" />
                                        </TableCell>
                                    )}
                                    {columns.map((column, cellIndex) => (
                                        <TableCell
                                            key={`loading-cell-${index}-${cellIndex}`}
                                            className={cn(
                                                column.align === "center" && "text-center",
                                                column.align === "right" && "text-right",
                                                column.fixed === "left" &&
                                                "sticky left-0 z-10 bg-background",
                                                column.fixed === "right" &&
                                                "sticky right-0 z-10 bg-background"
                                            )}
                                        >
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : displayData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)
                                    }
                                    className="h-24 text-center"
                                >
                                    {emptyText}
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayData.map((item, index) => {
                                const rowKey = keyExtractor(item);
                                const isExpanded = expandedRows[rowKey];
                                const isSelected = selectedItems.some(
                                    (i) => keyExtractor(i) === rowKey
                                );

                                return (
                                    <React.Fragment key={rowKey}>
                                        <TableRow
                                            className={cn(
                                                isSelected && "bg-muted/50",
                                                getRowClassName(item, index)
                                            )}
                                        >
                                            {/* Expansion control */}
                                            {expandable && (
                                                <TableCell className="p-0 px-2 w-8">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => toggleRowExpansion(rowKey)}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            )}

                                            {/* Selection checkbox */}
                                            {selectable && (
                                                <TableCell className="p-0 px-2 w-8">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectItem(item, checked === true)
                                                        }
                                                        aria-label={`Select row ${index + 1}`}
                                                    />
                                                </TableCell>
                                            )}

                                            {/* Data cells */}
                                            {columns.map((column) => (
                                                <TableCell
                                                    key={`${rowKey}-${column.key}`}
                                                    className={cn(
                                                        column.align === "center" && "text-center",
                                                        column.align === "right" && "text-right",
                                                        column.fixed === "left" &&
                                                        "sticky left-0 z-10 bg-background",
                                                        column.fixed === "right" &&
                                                        "sticky right-0 z-10 bg-background"
                                                    )}
                                                >
                                                    {column.cell(item, index)}
                                                </TableCell>
                                            ))}
                                        </TableRow>

                                        {/* Expanded row content */}
                                        {expandable && isExpanded && renderExpandedRow && (
                                            <TableRow className="bg-accent/30">
                                                <TableCell
                                                    colSpan={columns.length + (selectable ? 1 : 0) + 1}
                                                    className="p-4"
                                                >
                                                    {renderExpandedRow(item)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bottom pagination */}
            {(pagination.position === "bottom" || pagination.position === "both") &&
                !pagination.infiniteScroll &&
                totalPages > 0 &&
                renderPaginationControls()}

            {/* Selection summary */}
            {selectable && selectedItems.length > 0 && (
                <div className="text-sm bg-muted/50 p-2 rounded">
                    {selectedItems.length} item(s) selected
                </div>
            )}
        </div>
    );
}

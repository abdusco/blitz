import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Table, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { PropsWithChildren, ReactNode } from 'react';
import { Column, Row, TableOptions, useExpanded, useSortBy, useTable } from 'react-table';

export default function DataTable<T extends object>(
    props: PropsWithChildren<{
        columns: Column<T>[];
        data: T[];
        renderRowDetail?: (row: Row<T>) => ReactNode;
        canExpand?: (row: Row<T>) => boolean;
    }>
) {
    // Use the state and functions returned from useTable to build your UI
    const { columns, data, renderRowDetail, canExpand } = props;

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        visibleColumns,
        rows,
        prepareRow,
        state: { expanded },
    } = useTable<T>(
        {
            columns,
            data,
        },
        useSortBy,
        useExpanded
    );

    // Render the UI for your table
    return (
        <>
            <Table {...getTableProps()}>
                <Thead>
                    {headerGroups.map((headerGroup) => (
                        <Tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => {
                                return (
                                    // Add the sorting props to control sorting. For this example
                                    // we can add them into the header props
                                    <Th {...column.getHeaderProps(column.getSortByToggleProps(column.props))}>
                                        {column.render('Header')}
                                        {/* Add a sort direction indicator */}
                                        {column.isSorted ? (
                                            column.isSortedDesc ? (
                                                <ChevronDownIcon w={8} />
                                            ) : (
                                                <ChevronUpIcon w={8} />
                                            )
                                        ) : null}
                                    </Th>
                                );
                            })}
                        </Tr>
                    ))}
                </Thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        const isExpanded = (row as any).isExpanded;
                        const rowProps = row.getRowProps({ bg: isExpanded ? 'purple.50' : '' } as any);
                        const { key } = rowProps;
                        return (
                            <React.Fragment key={key}>
                                <Tr {...rowProps}>
                                    {row.cells.map((cell) => {
                                        return (
                                            <Td {...cell.getCellProps(cell.column.props || cell.column.cellProps)}>
                                                {cell.render('Cell')}
                                            </Td>
                                        );
                                    })}
                                </Tr>
                                {/*
                                    If the row is in an expanded state, render a row with a
                                    column that fills the entire length of the table.
                                */}
                                {canExpand?.(row) && (row as any).isExpanded && renderRowDetail ? (
                                    <Tr>
                                        <Td colSpan={visibleColumns.length}>
                                            {/*
                                                Inside it, call our renderRowSubComponent function. In reality,
                                                you could pass whatever you want as props to
                                                a component like this, including the entire
                                                table instance. But for this example, we'll just
                                                pass the row
                                                */}
                                            {renderRowDetail(row)}
                                        </Td>
                                    </Tr>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </Table>
        </>
    );
}

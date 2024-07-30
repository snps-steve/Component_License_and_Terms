import React from 'react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  goToFirstPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  goToLastPage: () => void;
  licensesPerPage: number;
  handlePerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  goToFirstPage,
  goToPreviousPage,
  goToNextPage,
  goToLastPage,
  licensesPerPage,
  handlePerPageChange,
}) => {
  return (
    <div className="flex justify-end items-center mt-4 space-x-4">
      <div className="flex items-center space-x-2">
        <button onClick={goToFirstPage} disabled={currentPage === 1} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">
          <ChevronDoubleLeftIcon className="h-5 w-5" />
        </button>
        <button onClick={goToPreviousPage} disabled={currentPage === 1} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
        <button onClick={goToLastPage} disabled={currentPage === totalPages} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">
          <ChevronDoubleRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <select
          id="per-page"
          name="per-page"
          value={licensesPerPage}
          onChange={handlePerPageChange}
          className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={250}>250</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
          <option value={1500}>1500</option>
          <option value={-1}>All</option>
        </select>
      </div>
    </div>
  );
};

export default PaginationControls;

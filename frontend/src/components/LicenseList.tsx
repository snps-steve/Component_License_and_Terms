// src/components/LicenseList.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PaginationControls from './PaginationControls';

interface License {
  id: number;
  name: string;
  ownership: string;
  inUse: boolean;
  licenseFamily: string;
  licenseSource: string;
  licenseStatus: string;
}

type LicenseKey = keyof License;

interface LicenseListProps {
  onClearCredentials: () => Promise<void>;
  onSeedData: () => Promise<void>;
  onClearLicenses: () => Promise<void>;
}

const columnWidths: Record<LicenseKey, number> = {
  id: 0, // This should be present because it's part of License, but we'll hide it by setting width to 0.
  name: 250,
  ownership: 150,
  inUse: 75,
  licenseFamily: 150,
  licenseSource: 75,
  licenseStatus: 75
};

const LicenseList: React.FC<LicenseListProps> = ({ onClearCredentials, onSeedData, onClearLicenses }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [totalLicenses, setTotalLicenses] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [licensesPerPage, setLicensesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<LicenseKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadLicenses();
  }, [currentPage, licensesPerPage, searchTerm, sortField, sortOrder]);

  const loadLicenses = async () => {
    try {
      const response = await axios.get('/api/bd/licenses', {
        params: {
          limit: licensesPerPage,
          offset: (currentPage - 1) * licensesPerPage,
          search: searchTerm,
          sortField,
          sortOrder
        }
      });
      if (response.data && Array.isArray(response.data.licenses)) {
        setLicenses(response.data.licenses);
        setTotalLicenses(response.data.totalCount); // Assuming the total count is returned by the API
      } else {
        console.error('Unexpected response structure:', response.data);
        setLicenses([]);
        setTotalLicenses(0);
      }
    } catch (error) {
      console.error('Failed to load licenses:', error);
      setLicenses([]);
      setTotalLicenses(0);
    }
  };

  const handleSort = (field: LicenseKey) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLicensesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing records per page
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(totalLicenses / licensesPerPage);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prevPage => Math.max(prevPage - 1, 1));

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex justify-between mt-4 mb-4">
            <button onClick={loadLicenses} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
              Load Licenses
            </button>
            <button onClick={onSeedData} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
              Seed License and Term Data
            </button>
            <button onClick={onClearLicenses} className="bg-red-500 text-white px-4 py-2 rounded mb-4">
              Clear Licenses
            </button>
            <button onClick={onClearCredentials} className="bg-red-500 text-white px-4 py-2 rounded mb-4">
              Clear Credentials
            </button>
          </div>
          <div className="mt-3 sm:ml-4 sm:mt-0">
            <label htmlFor="mobile-search-license" className="sr-only">
              Search
            </label>
            <label htmlFor="desktop-search-license" className="sr-only">
              Search
            </label>
            <div className="flex rounded-md shadow-sm">
              <div className="relative flex-grow focus-within:z-10">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="mobile-search-license"
                  name="mobile-search-license"
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:hidden"
                />
                <input
                  id="desktop-search-license"
                  name="desktop-search-license"
                  type="text"
                  placeholder="Search licenses"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="hidden w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-sm leading-6 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:block"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              Number of licenses enumerated and stored in the database: {totalLicenses}
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              goToFirstPage={goToFirstPage}
              goToPreviousPage={goToPreviousPage}
              goToNextPage={goToNextPage}
              goToLastPage={goToLastPage}
              licensesPerPage={licensesPerPage}
              handlePerPageChange={handlePerPageChange}
            />
          </div>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'ownership', label: 'Ownership' },
                      { key: 'inUse', label: 'In Use' },
                      { key: 'licenseFamily', label: 'Family' },
                      { key: 'licenseSource', label: 'Source' },
                      { key: 'licenseStatus', label: 'Status' },
                    ].map(column => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key as LicenseKey)}
                        className="cursor-pointer py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        style={{ width: `${columnWidths[column.key as LicenseKey]}px` }}
                      >
                        {column.label}
                        {sortField === column.key && (
                          sortOrder === 'asc' ? <ChevronUpIcon className="h-5 w-5 inline" /> : <ChevronDownIcon className="h-5 w-5 inline" />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {licenses.map((license) => (
                    <tr key={license.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6" style={{ width: `${columnWidths.name}px` }}>
                        {license.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" style={{ width: `${columnWidths.ownership}px` }}>
                        {license.ownership}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" style={{ width: `${columnWidths.inUse}px` }}>
                        {license.inUse ? 'Yes' : 'No'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" style={{ width: `${columnWidths.licenseFamily}px` }}>
                        {license.licenseFamily}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" style={{ width: `${columnWidths.licenseSource}px` }}>
                        {license.licenseSource}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" style={{ width: `${columnWidths.licenseStatus}px` }}>
                        {license.licenseStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            goToFirstPage={goToFirstPage}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
            goToLastPage={goToLastPage}
            licensesPerPage={licensesPerPage}
            handlePerPageChange={handlePerPageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default LicenseList;

// src/components/LicenseList.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronUpIcon, ChevronDownIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PaginationControls from './PaginationControls';
import Confirmation from './Confirmation';

interface License {
  id: number;
  name: string;
  ownership: string;
  inUse: boolean;
  licenseFamily: string;
  licenseSource: string;
  licenseStatus: string;
}

interface LicenseTerm {
  licenseId: number;
  name: string;
  description: string;
  responsibility: string;
}

type LicenseKey = keyof License;

interface LicenseListProps {
  onClearCredentials: () => Promise<void>;
  onSeedData: () => Promise<void>;
  onClearLicenses: () => Promise<void>;
}

const columnWidths: Record<LicenseKey, number> = {
  id: 0,
  name: 250,
  ownership: 150,
  inUse: 125,
  licenseFamily: 150,
  licenseSource: 125,
  licenseStatus: 125,
};

const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-US').format(number);
};

const LicenseList: React.FC<LicenseListProps> = ({ onClearCredentials, onSeedData, onClearLicenses }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licenseTerms, setLicenseTerms] = useState<Record<number, LicenseTerm[]>>({});
  const [totalLicenses, setTotalLicenses] = useState<number>(0);
  const [openSourceCount, setOpenSourceCount] = useState<number>(0);
  const [proprietaryCount, setProprietaryCount] = useState<number>(0);
  const [unknownCount, setUnknownCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [licensesPerPage, setLicensesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<LicenseKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedLicense, setExpandedLicense] = useState<number | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationButtonText, setConfirmationButtonText] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<() => Promise<void>>(() => Promise.resolve);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountdownOpen, setIsCountdownOpen] = useState(false);
  const [refreshWaitTime, setRefreshWaitTime] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Loading licenses with the following parameters:', {
      currentPage,
      licensesPerPage,
      searchTerm,
      sortField,
      sortOrder,
    });
    loadLicenses();
  }, [currentPage, licensesPerPage, searchTerm, sortField, sortOrder]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdown === 0) {
        window.location.reload(); // Reload the page when countdown reaches zero
      }
    } else {
      intervalRef.current = setInterval(() => {
        setCountdown((prevCountdown) => (prevCountdown !== null ? prevCountdown - 1 : null));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [countdown]);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const licensesResponse = await axios.get('/api/bd/licenses', {
        params: {
          limit: licensesPerPage,
          offset: (currentPage - 1) * licensesPerPage,
          search: searchTerm,
          sortField,
          sortOrder,
        },
      });

      console.log('Licenses response:', licensesResponse.data);

      const countsResponse = await axios.get('/api/bd/licenses/count');
      console.log('Counts response:', countsResponse.data);

      if (licensesResponse.data && Array.isArray(licensesResponse.data.licenses)) {
        setLicenses(licensesResponse.data.licenses);
        setTotalLicenses(licensesResponse.data.totalCount);
        setOpenSourceCount(countsResponse.data.openSourceCount);
        setProprietaryCount(countsResponse.data.proprietaryCount);
        setUnknownCount(countsResponse.data.unknownCount);
      } else {
        console.error('Unexpected response structure:', licensesResponse.data);
        setLicenses([]);
        setTotalLicenses(0);
        setOpenSourceCount(0);
        setProprietaryCount(0);
        setUnknownCount(0);
      }
    } catch (error) {
      console.error('Failed to load licenses:', error);
      setLicenses([]);
      setTotalLicenses(0);
      setOpenSourceCount(0);
      setProprietaryCount(0);
      setUnknownCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLicenseTerms = async (licenseId: number) => {
    if (licenseTerms[licenseId]) return;

    try {
      console.log(`Fetching terms for license ID: ${licenseId}`);
      const response = await axios.get(`/api/bd/licenses/${licenseId}/terms`);
      console.log(`Terms response for license ID ${licenseId}:`, response.data);
      if (response.data && Array.isArray(response.data)) {
        setLicenseTerms((prevTerms) => ({
          ...prevTerms,
          [licenseId]: response.data,
        }));
      } else {
        console.error('Unexpected response structure:', response.data);
      }
    } catch (error) {
      console.error(`Failed to load license terms for license ID ${licenseId}:`, error);
    }
  };

  const handleSort = (field: LicenseKey) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
    console.log(`Sorting by ${field} in ${order} order`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    console.log('Search term:', e.target.value);
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLicensesPerPage(Number(e.target.value));
    setCurrentPage(1);
    console.log('Licenses per page:', Number(e.target.value));
  };

  const handleExpand = async (licenseId: number) => {
    setExpandedLicense(expandedLicense === licenseId ? null : licenseId);
    console.log(`Toggling expand for license ID: ${licenseId}`);
    if (expandedLicense !== licenseId) {
      await fetchLicenseTerms(licenseId);
    }
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    console.log('Changing to page:', pageNumber);
  };

  const totalPages = Math.ceil(totalLicenses / licensesPerPage);

  const goToFirstPage = () => {
    setCurrentPage(1);
    console.log('Going to first page');
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    console.log('Going to last page');
  };

  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
    console.log('Going to next page');
  };

  const goToPreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    console.log('Going to previous page');
  };

  const stats = [
    { name: 'Total Licenses', value: totalLicenses, change: '', changeType: 'positive' },
    { name: 'Open Source', value: openSourceCount, change: '', changeType: 'positive' },
    { name: 'Proprietary', value: proprietaryCount, change: '', changeType: 'positive' },
    { name: 'Unknown', value: unknownCount, change: '', changeType: 'positive' },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }

  const groupTermsByResponsibility = (terms: LicenseTerm[]) => {
    return terms.reduce((groups, term) => {
      const { responsibility } = term;
      if (!groups[responsibility]) {
        groups[responsibility] = [];
      }
      groups[responsibility].push(term);
      return groups;
    }, {} as Record<string, LicenseTerm[]>);
  };

  const handleClearLicenses = async () => {
    setConfirmationMessage('Are you sure you want to clear all licenses? This action cannot be undone.');
    setConfirmationButtonText('Clear Licenses');
    setConfirmationAction(() => onClearLicenses);
    setIsConfirmationOpen(true);
  };

  const handleClearCredentials = async () => {
    setConfirmationMessage('Are you sure you want to clear all credentials? This action cannot be undone.');
    setConfirmationButtonText('Clear Credentials');
    setConfirmationAction(() => onClearCredentials);
    setIsConfirmationOpen(true);
  };

  const handleSeedData = async () => {
    try {
      console.log("Seed Data button clicked");
      await onSeedData();
      console.log("Data seeded");
      setCountdown(refreshWaitTime);
      setIsCountdownOpen(true);
    } catch (error) {
      console.error("Failed to seed data:", error);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
          >
            <dt className="text-sm font-medium leading-6 text-gray-500">{stat.name}</dt>
            <dd className={classNames('text-xs font-medium', stat.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700')}>
              {stat.change}
            </dd>
            <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
              {formatNumber(stat.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex justify-between mt-4 mb-4">
            <button onClick={loadLicenses} className="bg-blue-500 text-white px-4 py-2 rounded mb-4 flex items-center">
              {isLoading && <span className="loader mr-2"></span>}
              Load Licenses
            </button>
            <button onClick={handleSeedData} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
              Seed License and Term Data
            </button>
            <button onClick={handleClearLicenses} className="bg-red-500 text-white px-4 py-2 rounded mb-4">
              Clear Licenses
            </button>
            <button onClick={handleClearCredentials} className="bg-red-500 text-white px-4 py-2 rounded mb-4">
              Clear Credentials
            </button>
          </div>
          <div className="flex items-center mt-4">
            <label htmlFor="refresh-wait-time" className="text-sm font-medium text-gray-700 mr-2">
              Refresh Wait Time (seconds):
            </label>
            <input
              type="number"
              id="refresh-wait-time"
              value={refreshWaitTime}
              onChange={(e) => setRefreshWaitTime(Number(e.target.value))}
              className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
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
          <div className="mt-4 flex justify-end">
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
                    ].map((column) => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key as LicenseKey)}
                        className="cursor-pointer py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        style={{ width: `${columnWidths[column.key as LicenseKey]}px`, paddingLeft: column.key === 'name' ? '2rem' : '1rem' }}
                      >
                        <div className="flex items-center">
                          {column.label}
                          <span className="inline-flex items-center ml-2">
                            <ChevronUpIcon
                              className={`h-5 w-5 ${sortField === column.key && sortOrder === 'asc' ? 'text-gray-900' : 'text-gray-400'}`}
                            />
                            <ChevronDownIcon
                              className={`h-5 w-5 ${sortField === column.key && sortOrder === 'desc' ? 'text-gray-900' : 'text-gray-400'}`}
                            />
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {licenses.map((license) => (
                    <React.Fragment key={license.id}>
                      <tr onClick={() => handleExpand(license.id)} className="cursor-pointer">
                        <td
                          className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                          style={{ width: `${columnWidths.name}px` }}
                        >
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
                        <td className="px-3 py-4 text-sm text-gray-500">
                          Terms
                          {expandedLicense === license.id ? (
                            <ChevronDoubleUpIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDoubleDownIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </td>
                      </tr>
                      {expandedLicense === license.id && (
                        <tr>
                          <td colSpan={7}>
                            <div className="p-4 bg-gray-50">
                              {licenseTerms[license.id] ? (
                                Object.entries(groupTermsByResponsibility(licenseTerms[license.id])).map(([responsibility, terms]) => (
                                  <div key={responsibility} className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900">{responsibility}</h4>
                                    <ul className="list-disc pl-5">
                                      {terms.map((term) => (
                                        <li key={term.name} className="mb-1">
                                          <span className="font-medium text-gray-500 italic">{term.name}:</span>{' '}
                                          <span className="text-gray-500">{term.description}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))
                              ) : (
                                <div>Loading terms...</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
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
      <Confirmation
        isOpen={isConfirmationOpen}
        setIsOpen={setIsConfirmationOpen}
        message={confirmationMessage}
        confirmButtonText={confirmationButtonText}
        onConfirm={confirmationAction}
      />
      {isCountdownOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-medium text-gray-900">Page will reload in {countdown} seconds</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseList;

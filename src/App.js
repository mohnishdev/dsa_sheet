import React, { useState, useEffect, useCallback } from 'react';
import { data } from './data.js'; // Import named export 'data' from data.js
import './App.css';

// Function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const App = () => {
  const [dataState, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [topics, setTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Initialize data and load from local storage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dsaSheetData')) || {};
    const updatedData = data.map((row) => ({
      ...row,
      ...Object.keys(savedData[row.id] || {}).reduce((acc, key) => {
        if (key.startsWith('Attempt')) {
          acc[key] = savedData[row.id][key];
        }
        return acc;
      }, {}),
    }));

    setData(updatedData);
    setFilteredData(updatedData);
    setTopics([...new Set(updatedData.map((row) => row.Topic))].sort());
  }, []);

  // Handle checkbox changes and save to local storage
  const handleCheckboxChange = (id, attempt) => {
    const updatedData = dataState.map((row) =>
      row.id === id ? { ...row, [attempt]: !row[attempt] } : row
    );
    setData(updatedData);
    setFilteredData(
      updatedData.filter((row) =>
        applyFilters(row, topicFilter, difficultyFilter)
      )
    );

    const savedData = JSON.parse(localStorage.getItem('dsaSheetData')) || {};
    savedData[id] = savedData[id] || {};
    savedData[id][attempt] = !savedData[id][attempt];
    localStorage.setItem('dsaSheetData', JSON.stringify(savedData));
  };

  // Apply filters
  const applyFilters = (row, topic, difficulty) => {
    const matchesTopic = !topic || row.Topic === topic;
    const matchesDifficulty = !difficulty || row.Difficulty === difficulty;
    return matchesTopic && matchesDifficulty;
  };

  // Memoize handleFilterChange
  const handleFilterChange = useCallback(() => {
    const filtered = dataState.filter((row) =>
      applyFilters(row, topicFilter, difficultyFilter)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [dataState, topicFilter, difficultyFilter]);

  // Trigger filter changes
  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">DSA Sheet Tracker</h1>

      {/* Filter Section */}
      <div className="filter-container">
        <div className="filter-group">
          <label className="filter-label">Filter by Topic:</label>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Filter by Difficulty:</label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <button
          onClick={() => {
            setTopicFilter('');
            setDifficultyFilter('');
            setFilteredData(dataState);
            setCurrentPage(1);
          }}
          className="reset-button"
        >
          Reset Filters
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="dsa-table">
          <thead className="table-header">
            <tr>
              <th>Task Name</th>
              <th>Topic</th>
              <th>Difficulty</th>
              {Array.from({ length: 10 }, (_, i) => (
                <th key={i} className="attempt-header">
                  {getOrdinal(i + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id} className="table-row">
                <td>{row['Task Name']}</td>
                <td>{row.Topic}</td>
                <td>
                  <span
                    className={`difficulty-badge ${
                      row.Difficulty === 'Easy'
                        ? 'bg-green-100 text-green-800'
                        : row.Difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {row.Difficulty}
                  </span>
                </td>
                {Array.from({ length: 10 }, (_, i) => (
                  <td key={i} className="text-center">
                    <input
                      type="checkbox"
                      checked={row[`Attempt${i + 1}`]}
                      onChange={() => handleCheckboxChange(row.id, `Attempt${i + 1}`)}
                      className="checkbox"
                      title={`Attempt ${i + 1}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="items-per-page">
          <label className="items-per-page-label">Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="items-per-page-select"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
          )
          .map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-button ${
                currentPage === page ? 'active' : ''
              }`}
            >
              {page}
            </button>
          ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default App;
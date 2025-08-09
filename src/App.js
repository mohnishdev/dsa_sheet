import React, { useState, useEffect, useCallback } from 'react';
import { data } from './data.js';
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
  const [editingTags, setEditingTags] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [showTagsModal, setShowTagsModal] = useState(null);

  // Initialize data and load from local storage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dsaSheetData')) || {};
    const updatedData = data.map((row) => ({
      ...row,
      tags: savedData[row.id]?.tags || [],
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

  // Handle tag addition
  const handleAddTag = (id) => {
    if (newTag.trim() === '') return;
    const updatedData = dataState.map((row) =>
      row.id === id
        ? { ...row, tags: [...(row.tags || []), newTag.trim()] }
        : row
    );
    setData(updatedData);
    setFilteredData(
      updatedData.filter((row) =>
        applyFilters(row, topicFilter, difficultyFilter)
      )
    );
    setNewTag('');
    setEditingTags(null);

    const savedData = JSON.parse(localStorage.getItem('dsaSheetData')) || {};
    savedData[id] = savedData[id] || {};
    savedData[id].tags = updatedData.find((row) => row.id === id).tags;
    localStorage.setItem('dsaSheetData', JSON.stringify(savedData));
  };

  // Handle tag removal
  const handleRemoveTag = (id, tagIndex) => {
    const updatedData = dataState.map((row) =>
      row.id === id
        ? { ...row, tags: row.tags.filter((_, index) => index !== tagIndex) }
        : row
    );
    setData(updatedData);
    setFilteredData(
      updatedData.filter((row) =>
        applyFilters(row, topicFilter, difficultyFilter)
      )
    );

    const savedData = JSON.parse(localStorage.getItem('dsaSheetData')) || {};
    savedData[id] = savedData[id] || {};
    savedData[id].tags = updatedData.find((row) => row.id === id).tags;
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
              <th>Tags</th>
              {Array.from({ length: 8 }, (_, i) => (
                <th key={i} className="attempt-header">
                  <span className="tooltip">
                    {getOrdinal(i + 1)}
                    <span className="tooltip-text">Attempt {i + 1}</span>
                  </span>
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
                <td className="tags-cell">
                  {editingTags === row.id ? (
                    <div className="tag-input-container">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="tag-input"
                        placeholder="Add tag..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddTag(row.id);
                        }}
                      />
                      <button
                        onClick={() => handleAddTag(row.id)}
                        className="tag-save-button"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTags(null)}
                        className="tag-cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="tags-container">
                      {(row.tags || []).slice(0, 2).map((tag, index) => (
                        <span key={index} className="tag-badge">
                          {tag}
                          <button
                            className="tag-remove-button"
                            onClick={() => handleRemoveTag(row.id, index)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                      {(row.tags || []).length > 2 && (
                        <button
                          className="see-more-button"
                          onClick={() => setShowTagsModal(row.id)}
                        >
                          See More
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTags(row.id)}
                        className="add-tag-button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  {showTagsModal === row.id && (
                    <div className="modal-overlay">
                      <div className="modal-content">
                        <h3 className="modal-title">All Tags for {row['Task Name']}</h3>
                        <div className="modal-tags">
                          {(row.tags || []).map((tag, index) => (
                            <span key={index} className="tag-badge modal-tag">
                              {tag}
                              <button
                                className="tag-remove-button"
                                onClick={() => handleRemoveTag(row.id, index)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowTagsModal(null)}
                          className="modal-close-button"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                {Array.from({ length: 8 }, (_, i) => (
                  <td key={i} className="text-center">
                    <input
                      type="checkbox"
                      checked={row[`Attempt${i + 1}`]}
                      onChange={() => handleCheckboxChange(row.id, `Attempt${i + 1}`)}
                      className="checkbox attempt-checkbox"
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
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { data } from './data.js';
import './App.css';

// Function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const Modal = ({ isOpen, onClose, taskName, hints, onAddHint, onEditHint, onRemoveHint }) => {
  const [newHint, setNewHint] = useState('');
  const [editingHint, setEditingHint] = useState(null);
  const [editingHintText, setEditingHintText] = useState('');

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Hints for {taskName}</h3>
        <div className="modal-hints">
          {(hints || []).map((hint, index) => (
            <div key={index} className="hint-item">
              {editingHint === index ? (
                <div className="hint-input-container">
                  <input
                    type="text"
                    value={editingHintText}
                    onChange={(e) => setEditingHintText(e.target.value)}
                    className="hint-input"
                    placeholder="Edit hint..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        onEditHint(index);
                        setEditingHint(null);
                        setEditingHintText('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      onEditHint(index);
                      setEditingHint(null);
                      setEditingHintText('');
                    }}
                    className="hint-save-button"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingHint(null)}
                    className="hint-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="hint-display">
                  <span className="hint-text">{hint}</span>
                  <div className="hint-actions">
                    <button
                      className="hint-edit-button"
                      onClick={() => {
                        setEditingHint(index);
                        setEditingHintText(hint);
                      }}
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      className="hint-remove-button"
                      onClick={() => onRemoveHint(index)}
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
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="hint-input-container">
          <input
            type="text"
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            className="hint-input"
            placeholder="Add new hint..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onAddHint(newHint);
                setNewHint('');
              }
            }}
          />
          <button
            onClick={() => {
              onAddHint(newHint);
              setNewHint('');
            }}
            className="hint-add-button"
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
        <button onClick={onClose} className="modal-close-button">
          Close
        </button>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

const App = () => {
  const [dataState, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [topics, setTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showHintsModal, setShowHintsModal] = useState(null);

  // Initialize data and load from local storage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dsaSheetData')) || {};
    const updatedData = data.map((row) => ({
      ...row,
      hints: savedData[row.id]?.hints || [],
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

  // Disable body scroll when modal is open and preserve scroll position
  useEffect(() => {
    if (showHintsModal !== null) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';
      return () => {
        const scrollYRestored = parseInt(document.body.style.top || '0', 10) * -1;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollYRestored);
      };
    }
  }, [showHintsModal]);

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

  // Handle hint addition
  const handleAddHint = (id) => (hint) => {
    if (hint.trim() === '') return;
    const updatedData = dataState.map((row) =>
      row.id === id
        ? { ...row, hints: [...(row.hints || []), hint.trim()] }
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
    savedData[id].hints = updatedData.find((row) => row.id === id).hints;
    localStorage.setItem('dsaSheetData', JSON.stringify(savedData));
  };

  // Handle hint edit
  const handleEditHint = (id) => (hintIndex) => {
    const row = dataState.find((row) => row.id === id);
    const editingHintText = document.querySelector(`.modal-content input.hint-input`).value;
    if (editingHintText.trim() === '') return;
    const updatedData = dataState.map((row) =>
      row.id === id
        ? {
            ...row,
            hints: row.hints.map((hint, index) =>
              index === hintIndex ? editingHintText.trim() : hint
            ),
          }
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
    savedData[id].hints = updatedData.find((row) => row.id === id).hints;
    localStorage.setItem('dsaSheetData', JSON.stringify(savedData));
  };

  // Handle hint removal
  const handleRemoveHint = (id) => (hintIndex) => {
    const updatedData = dataState.map((row) =>
      row.id === id
        ? { ...row, hints: row.hints.filter((_, index) => index !== hintIndex) }
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
    savedData[id].hints = updatedData.find((row) => row.id === id).hints;
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
              <th>Hints</th>
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
                <td className="hints-cell">
                  <button
                    onClick={() => setShowHintsModal(row.id)}
                    className="view-hints-button"
                  >
                    {row.hints && row.hints.length > 0
                      ? `View ${row.hints.length} Hint${
                          row.hints.length > 1 ? 's' : ''
                        }`
                      : 'Add Hint'}
                  </button>
                </td>
                {Array.from({ length: 8 }, (_, i) => (
                  <td key={i} className="text-center">
                    <input
                      type="checkbox"
                      checked={row[`Attempt${i + 1}`]}
                      onChange={() =>
                        handleCheckboxChange(row.id, `Attempt${i + 1}`)
                      }
                      className="checkbox attempt-checkbox"
                      title={`Attempt ${i + 1}`}
                    />
                  </td>
                ))}
                {showHintsModal === row.id && (
                  <Modal
                    isOpen={showHintsModal === row.id}
                    onClose={() => setShowHintsModal(null)}
                    taskName={row['Task Name']}
                    hints={row.hints}
                    onAddHint={handleAddHint(row.id)}
                    onEditHint={handleEditHint(row.id)}
                    onRemoveHint={handleRemoveHint(row.id)}
                  />
                )}
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
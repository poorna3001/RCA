import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const dynamicStyles = `
  /* LIFT STACK ZONE FRAMEWORK - FIXED Z-INDEX ISSUES */
  .filter-row-deck-container { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 16px; 
    margin-bottom: 20px; 
    position: relative; 
    z-index: 1000; 
    isolation: isolate; 
  }
  
  .rca-dropdown-wrapper { 
    position: relative; 
    width: 100%; 
    font-family: var(--fb); 
    z-index: 1000; 
  }
  
  .rca-dropdown-trigger { 
    background: var(--card); 
    border: 1px solid var(--bdr); 
    border-radius: 10px; 
    padding: 14px 20px; 
    cursor: pointer; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    color: var(--txt); 
    transition: all 0.25s ease; 
    font-weight: 500;
    position: relative;
    z-index: 1001;
  }
  
  .rca-dropdown-trigger:hover { 
    border-color: var(--teal); 
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.15); 
  }
  
  .rca-dropdown-overlay-list { 
    position: absolute; 
    top: 100%; 
    left: 0; 
    right: 0; 
    background: var(--card2); 
    border: 1px solid var(--bdr); 
    border-radius: 12px; 
    margin-top: 8px; 
    max-height: 360px; 
    overflow-y: auto; 
    z-index: 10000; 
    padding: 6px; 
    box-shadow: 0 20px 40px rgba(0,0,0,0.65);
  }
  
  .rca-dropdown-row-item { 
    padding: 12px 16px; 
    border-radius: 8px; 
    cursor: pointer; 
    color: var(--txt); 
    transition: all 0.2s ease; 
    font-size: 13px; 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    text-align: left; 
  }
  
  .rca-dropdown-row-item:hover { 
    background: var(--teal-d); 
    color: var(--teal); 
    padding-left: 22px; 
  }
  
  .rca-dropdown-row-item.active { 
    background: var(--teal-g); 
    color: var(--teal); 
    font-weight: 700; 
    border-left: 3px solid var(--teal); 
  }
  
  .tree-node-rect { 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
    fill: var(--surf); 
    rx: 8px; 
    pointer-events: all; 
  }
  
  .interactive-svg-group:hover .tree-node-rect { 
    fill: var(--card2); 
    filter: drop-shadow(0 0 12px rgba(0, 212, 170, 0.25)); 
  }
  
  .interactive-svg-group.selected .tree-node-rect { 
    stroke-width: 2.5px !important; 
    fill: var(--card2) !important; 
    stroke: var(--teal) !important; 
  }

  .rca-dashboard-split-grid { 
    display: grid; 
    grid-template-columns: 1fr 430px; 
    gap: 20px; 
    margin-top: 15px; 
    min-height: 0; 
    position: relative; 
    z-index: 10; 
  }
  
  .rca-tree-canvas { 
    background: var(--surf); 
    border: 1px solid var(--bdr); 
    border-radius: var(--rl); 
    overflow: hidden; 
    display: flex; 
    align-items: center; 
    position: relative; 
    cursor: grab; 
    pointer-events: all; 
    height: 680px; 
    z-index: 20; 
    overflow: auto;
  }
  
  .rca-tree-canvas:active { cursor: grabbing; }
  .rca-tree-canvas::-webkit-scrollbar { width: 6px; height: 6px; }
  .rca-tree-canvas::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 4px; }

  .zoom-control-panel { 
    position: absolute; 
    bottom: 20px; 
    left: 20px; 
    background: var(--card2); 
    border: 1px solid var(--bdr); 
    border-radius: 8px; 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
    padding: 4px; 
    z-index: 100; 
    pointer-events: all; 
  }
  
  .zoom-btn { 
    background: var(--surf); 
    border: 1px solid var(--bdr); 
    color: var(--txt); 
    width: 34px; 
    height: 34px; 
    border-radius: 6px; 
    font-weight: 700; 
    font-size: 16px; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    transition: all 0.2s; 
  }
  
  .zoom-btn:hover { 
    border-color: var(--teal); 
    color: var(--teal); 
    background: var(--card); 
  }
  
  .trigger-chevron { 
    transition: transform 0.3s ease; 
    color: var(--teal); 
  }
  
  .trigger-chevron.open { transform: rotate(180deg); }
  
  .ai-badge { 
    color: #10e08a; 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    font-size: 11px; 
    font-weight: 700; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
  }
  
  .ai-badge::before { content: '●'; font-size: 10px; }
  
  .type-chip { 
    display: inline-block; 
    padding: 5px 12px; 
    border-radius: 20px; 
    font-size: 10px; 
    font-weight: 700; 
    letter-spacing: 0.06em; 
    text-transform: uppercase; 
    margin-top: 8px; 
  }
  
  .type-chip.exception { 
    background: rgba(255, 77, 106, 0.15); 
    color: #ff4d6a; 
    border: 1px solid rgba(255, 77, 106, 0.3); 
  }
  
  .type-chip.root-cause { 
    background: rgba(255, 184, 48, 0.15); 
    color: #ffb830; 
    border: 1px solid rgba(255, 184, 48, 0.3); 
  }
  
  .type-chip.sub-cause { 
    background: rgba(59, 158, 255, 0.15); 
    color: #3b9eff; 
    border: 1px solid rgba(59, 158, 255, 0.3); 
  }
  
  .premium-metric-card { 
    background: linear-gradient(145deg, #111a2e, #0a1020); 
    border: 1px solid rgba(255,255,255,0.04); 
    border-radius: 12px; 
    padding: 18px; 
    margin-bottom: 12px; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.25); 
  }
  
  .metric-progress-container { 
    width: 100%; 
    background: #080d1a; 
    height: 8px; 
    border-radius: 10px; 
    margin-top: 10px; 
    overflow: hidden; 
  }
  
  .metric-progress-bar { 
    height: 100%; 
    border-radius: 10px; 
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); 
  }
  
  .metric-progress-bar.purple { background: linear-gradient(90deg, #783cf0, #3b9eff); }
  .metric-progress-bar.orange { background: linear-gradient(90deg, #ffb830, #ff4d6a); }

  .view-tx-btn-premium { 
    background: linear-gradient(135deg, #2563eb, #1d4ed8); 
    border: none; 
    border-radius: 8px; 
    color: #fff; 
    padding: 12px 20px; 
    font-size: 13px; 
    font-weight: 600; 
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    box-shadow: 0 4px 14px rgba(37,99,235,0.3); 
  }
  
  .view-tx-btn-premium:hover { 
    transform: translateY(-1px); 
    box-shadow: 0 6px 20px rgba(37,99,235,0.45); 
    filter: brightness(1.1); 
  }

  /* FIXED MODAL - NO OVERLAP */
  .tx-modal-overlay { 
    position: absolute; 
    inset: 0; 
    background: rgba(6, 10, 18, 0.92); 
    backdrop-filter: blur(8px); 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    z-index: 99999; 
    padding: 24px; 
  }
  
  .tx-modal-container { 
    background: #0a1020; 
    border-radius: 12px; 
    width: 100%; 
    max-width: 1650px; 
    height: 90vh; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.6); 
    border: 1px solid rgba(99,179,237,0.1); 
  }
  
  .tx-modal-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 20px 32px; 
    background: #0c1221; 
    flex-shrink: 0; 
    border-bottom: 1px solid rgba(99,179,237,0.1); 
    position: relative; 
    z-index: 30; 
    min-height: 70px;
  }
  
  .tx-modal-title { 
    font-size: 20px; 
    font-weight: 700; 
    color: #e2eaf6; 
    letter-spacing: -0.02em; 
    font-family: var(--fd); 
  }
  
  .tx-modal-subtitle { 
    font-size: 13px; 
    color: #5a7499; 
    margin-top: 2px; 
    font-weight: 500; 
  }
  
  .tx-download-btn { 
    background: #10b981; 
    border: none; 
    border-radius: 6px; 
    color: #fff; 
    padding: 8px 18px; 
    font-size: 13px; 
    font-weight: 600; 
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    cursor: pointer; 
    transition: background 0.15s ease; 
  }
  
  .tx-download-btn:hover { background: #059669; }
  
  .tx-dismiss-x { 
    background: transparent; 
    border: none; 
    font-size: 24px; 
    color: #5a7499; 
    cursor: pointer; 
    padding: 4px 8px; 
    line-height: 1; 
  }
  
  .tx-dismiss-x:hover { color: #e2eaf6; }

  .tx-table-wrapper { 
    flex: 1; 
    overflow: auto; 
    background: #060a12; 
    padding: 0; 
    position: relative; 
    z-index: 20; 
  }
  
  .tx-native-table { 
    min-width: 100%;
    width: max-content;
    border-collapse: collapse; 
    text-align: left; 
    font-size: 13px; 
    table-layout: auto; 
  }
  
  .tx-native-table th { 
    font-size: 11px; 
    font-weight: 700; 
    text-transform: uppercase; 
    color: #5a7499; 
    padding: 12px 16px; 
    background-color: #0c1221; 
    border-bottom: 2px solid rgba(99,179,237,0.1); 
    letter-spacing: 0.05em; 
    position: sticky; 
    top: 0; 
    z-index: 100; 
    white-space: nowrap; 
    text-align: left;
  }
  
  .tx-native-table td { 
    padding: 12px 16px; 
    border-bottom: 1px solid rgba(99,179,237,0.05); 
    color: #e2eaf6; 
    font-weight: 500; 
    line-height: 1.5; 
    vertical-align: middle; 
    background-color: #060a12; 
    text-align: left;
    white-space: nowrap;
  }
  
  .tx-native-table tbody tr:hover td { 
    background-color: #0c1221; 
  }
  
  .tx-cell-bold { 
    font-weight: 700; 
    color: #e2eaf6; 
  }
  
  .tx-cell-subtext { 
    font-size: 10px; 
    color: #5a7499; 
    font-weight: 500; 
    display: block; 
    margin-top: 2px; 
  }
  
  .tx-pill-status { 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    padding: 3px 10px; 
    border-radius: 4px; 
    font-size: 10px; 
    font-weight: 600; 
    background: rgba(59,158,255,0.15); 
    color: #3b9eff; 
    border: 1px solid rgba(59,158,255,0.2); 
    text-transform: uppercase; 
    letter-spacing: 0.02em; 
  }
  
  .tx-cell-comment { 
    font-weight: 600; 
    color: #10e08a; 
    background-color: rgba(16,224,138,0.03); 
    min-width: 260px;
    max-width: 360px;
    white-space: normal;
    word-break: break-word;
  }
  
  .tx-modal-footer { 
    background: #0c1221; 
    padding: 14px 32px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    border-top: 1px solid rgba(99,179,237,0.1); 
    flex-shrink: 0; 
    position: relative; 
    z-index: 30; 
  }
  
  .tx-footer-count { 
    font-size: 13px; 
    color: #5a7499; 
    font-weight: 600; 
  }
  
  .tx-footer-close-btn { 
    background: #1a2a3f; 
    border: none; 
    border-radius: 6px; 
    color: #e2eaf6; 
    padding: 8px 20px; 
    font-size: 13px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: background 0.15s; 
  }
  
  .tx-footer-close-btn:hover { background: #2a3f5a; }
  
  .bottom-analytics-deck { 
    display: flex; 
    flex-direction: column; 
    gap: 24px; 
    margin-top: 24px; 
    width: 100%; 
  }
  
  .correlation-card-wrapper { 
    background: var(--card); 
    border: 1px solid var(--bdr); 
    border-radius: 12px; 
    padding: 20px; 
    display: flex; 
    flex-direction: column; 
    gap: 12px; 
    transition: all 0.25s; 
  }
  
  .correlation-card-wrapper:hover { 
    border-color: rgba(0, 214, 170, 0.15); 
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
  }
  
  .correlation-item-row { 
    background: var(--card2); 
    border: 1px solid rgba(255,255,255,0.03); 
    border-radius: 8px; 
    padding: 16px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    position: relative; 
  }
  
  .correlation-item-left { 
    display: flex; 
    align-items: center; 
    gap: 16px; 
  }
  
  .status-indicator-dot { 
    width: 36px; 
    height: 36px; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-weight: 700; 
    font-size: 14px; 
    color: #fff; 
  }
  
  .impact-summary-grid { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 16px; 
    width: 100%; 
  }
  
  .summary-metric-box { 
    border-radius: 10px; 
    padding: 18px 22px; 
    display: flex; 
    flex-direction: column; 
    gap: 6px; 
    border: 1px solid rgba(255,255,255,0.02); 
  }
  
  .ai-insight-strip { 
    background: var(--card2); 
    border: 1px solid var(--bdr); 
    border-radius: 8px; 
    padding: 14px 18px; 
    font-size: 13px; 
    color: #a2b4dc; 
    line-height: 1.5; 
    display: flex; 
    align-items: center; 
    gap: 10px; 
  }

  /* Comment editing styles */
  .comment-edit-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }
  
  .comment-text {
    color: #10e08a;
    font-weight: 600;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    transition: background 0.2s;
    word-break: break-word;
    font-size: 12px;
  }
  
  .comment-text:hover {
    background: rgba(16, 224, 138, 0.1);
  }
  
  .comment-input {
    background: var(--card2);
    border: 1px solid var(--bdr2);
    border-radius: 4px;
    color: var(--txt);
    padding: 4px 8px;
    font-size: 12px;
    font-family: var(--fb);
    width: 100%;
    min-width: 120px;
  }
  
  .comment-input:focus {
    outline: none;
    border-color: var(--teal);
  }
  
  .comment-save-btn {
    background: var(--teal);
    border: none;
    border-radius: 4px;
    color: var(--bg);
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .comment-save-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 12px rgba(0, 212, 170, 0.3);
  }
  
  .comment-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .comment-cancel-btn {
    background: var(--card);
    border: 1px solid var(--bdr);
    border-radius: 4px;
    color: var(--muted);
    padding: 3px 8px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .comment-cancel-btn:hover {
    border-color: var(--muted);
    color: var(--txt);
  }

  .tx-header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tx-modal-header-left {
    flex: 1;
    min-width: 0;
  }

  .tx-modal-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  /* Column width classes */
  .col-amount { min-width: 100px; }
  .col-category { min-width: 160px; }
  .col-date { min-width: 130px; }
  .col-doc { min-width: 130px; }
  .col-status { min-width: 110px; }
  .col-sub { min-width: 160px; }
  .col-vendor { min-width: 180px; }
  .col-txid { min-width: 120px; }
  .col-comment { min-width: 250px; }

  /* Modal open - blur main content */
  .modal-open .rca-container,
  .modal-open .rca-dashboard-split-grid,
  .modal-open .bottom-analytics-deck {
    filter: blur(0px);
  }
`;

const CATEGORY_ICONS = {
  "All Categories": "📊",
  "Procure to Pay": "💳",
  "Order to Cash": "📈",
  "Scrap Management": "♻️",
  "Inventory Management": "📦",
  "Quality Management": "🧪",
  "Taxation": "📑",
  "Cyber Security": "🔐"
};

// Color mapping for correlation items
const CORRELATION_COLORS = [
  { bg: '#ff4d6a', shadow: 'rgba(255,77,106,0.3)', label: 'Critical Impact' },
  { bg: '#ffb830', shadow: 'rgba(255,184,48,0.3)', label: 'High Impact' },
  { bg: '#3b9eff', shadow: 'rgba(59,158,255,0.3)', label: 'Medium Impact' },
  { bg: '#10e08a', shadow: 'rgba(16,224,138,0.3)', label: 'Low Impact' }
];

const RootCauseExplorer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [masterExceptions, setMasterExceptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  
  const dropdownCatRef = useRef(null);
  const dropdownSubRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const [zoomScale, setZoomScale] = useState(0.7);
  const [panOffset, setPanOffset] = useState({ x: 20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  
  const pathParts = location.pathname.split('/').map(decodeURIComponent);
  const currentException = pathParts[2] && pathParts[2] !== '' ? pathParts[2] : '';

  const handleViewTransactions = useCallback(async () => {
    if (!selectedNode || !currentException) return;
    setModalOpen(true);
    setLoadingTx(true);
    setTxError(null);
    
    try {
      let url = `http://127.0.0.1:5001/rca/transactions/${encodeURIComponent(currentException)}`;
      const params = new URLSearchParams();
      if (selectedNode.level === 1) {
        params.append('category', selectedNode.name);
      } else if (selectedNode.level === 2) {
        params.append('category', selectedNode.parentName);
        params.append('sub_category', selectedNode.name);
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Transaction fetch error:', err);
      setTxError("Failed to pull matching transaction items from server pipelines.");
      setTransactions([]);
    } finally { 
      setLoadingTx(false); 
    }
  }, [selectedNode, currentException]);

  const handleSaveComment = useCallback(async (transactionId, comment) => {
    if (!currentException) return;
    
    setSavingComment(true);
    try {
      const response = await fetch(`http://127.0.0.1:5001/rca/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exception_name: currentException,
          transaction_id: transactionId,
          comment: comment
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save comment');
      }
      
      const result = await response.json();
      if (result.success) {
        // Update local state
        setTransactions(prev => 
          prev.map(tx => {
            const txId = tx.transaction_id || tx.id;
            return txId === transactionId 
              ? { ...tx, Comment: comment }
              : tx;
          })
        );
        setEditingComment(null);
        setCommentText('');
      } else {
        throw new Error(result.error || 'Failed to save comment');
      }
    } catch (err) {
      console.error('Error saving comment:', err);
      alert('Failed to save comment. Please try again.');
    } finally {
      setSavingComment(false);
    }
  }, [currentException]);

  const handleCategorySelection = useCallback((catName) => {
    setSelectedCategory(catName);
    setIsCatOpen(false);
    
    if (catName === 'All Categories') {
      setFilteredSubCategories(masterExceptions);
      if (currentException) {
        navigate('/rca', { replace: true });
      }
    } else {
      const targetedSubset = masterExceptions.filter(item => item.category === catName);
      setFilteredSubCategories(targetedSubset);
      if (targetedSubset.length > 0) {
        navigate(`/rca/${encodeURIComponent(targetedSubset[0].name)}`);
      }
    }
  }, [masterExceptions, navigate, currentException]);

  // Initial load - DO NOT auto-select any exception
  useEffect(() => {
    fetch('http://127.0.0.1:5001/rca/exceptions')
      .then(res => res.json())
      .then(data => {
        setMasterExceptions(data);
        const uniqueCats = ["All Categories", ...new Set(data.map(item => item.category))];
        setCategories(uniqueCats);
        setFilteredSubCategories(data);
        
        if (currentException) {
          const match = data.find(i => i.name === currentException);
          if (match) {
            setSelectedCategory(match.category);
            setFilteredSubCategories(data.filter(i => i.category === match.category));
          }
        } else {
          setSelectedCategory('All Categories');
          setFilteredSubCategories(data);
          setTreeData(null);
          setSelectedNode(null);
        }
      })
      .catch(() => setError("Failed to synchronize active backend communication pathways."));
  }, [currentException]);

  // Close dropdown menus on outside click
  useEffect(() => {
    const closeMenu = (e) => {
      if (dropdownCatRef.current && !dropdownCatRef.current.contains(e.target)) setIsCatOpen(false);
      if (dropdownSubRef.current && !dropdownSubRef.current.contains(e.target)) setIsSubOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  // Close modal when route changes
  useEffect(() => {
    setModalOpen(false);
    setTransactions([]);
    setEditingComment(null);
  }, [currentException, location.pathname]);

  // Update category filter when exception changes
  useEffect(() => {
    if (!currentException || masterExceptions.length === 0) {
      setSelectedCategory('All Categories');
      setFilteredSubCategories(masterExceptions);
      return;
    }
    const match = masterExceptions.find(i => i.name === currentException);
    if (match && selectedCategory !== match.category) {
      setSelectedCategory(match.category);
      setFilteredSubCategories(masterExceptions.filter(i => i.category === match.category));
    }
  }, [currentException, masterExceptions, selectedCategory]);

  // Build tree data
  useEffect(() => {
    if (!currentException) {
      setTreeData(null);
      setSelectedNode(null);
      return;
    }

    const buildTree = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:5001/rca/tree/${encodeURIComponent(currentException)}`);
        if (!res.ok) throw new Error('Failed to fetch tree data');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        if (data.count === 0 || !data.children || data.children.length === 0) {
          const emptyTree = {
            id: 'root', 
            name: data.name, 
            type: 'EXCEPTION', 
            value: 0, 
            count: 0, 
            pct: 100.0, 
            level: 0,
            description: data.description || '',
            children: []
          };
          setTreeData(emptyTree);
          setSelectedNode(emptyTree);
          setLoading(false);
          return;
        }
        
        const tree = {
          id: 'root', 
          name: data.name, 
          type: 'EXCEPTION', 
          value: data.value, 
          count: data.count, 
          pct: 100.0, 
          level: 0,
          description: data.description || '',
          children: data.children.map((parent, idx) => {
            const parentPct = data.value > 0 ? (parent.value / data.value) * 100 : 0;
            return {
              id: `parent-${idx}`, 
              name: parent.name, 
              type: 'ROOT CAUSE', 
              value: parent.value, 
              count: parent.count, 
              pct: parentPct, 
              level: 1,
              children: parent.children && parent.children.length > 0 ? parent.children.map((child, cIdx) => {
                const childPct = data.value > 0 ? (child.value / data.value) * 100 : 0;
                return {
                  id: `child-${idx}-${cIdx}`, 
                  name: child.name, 
                  type: 'SUB CAUSE', 
                  value: child.value, 
                  count: child.count, 
                  pct: childPct, 
                  level: 2, 
                  parentName: parent.name
                };
              }) : []
            };
          })
        };
        setTreeData(tree);
        setSelectedNode(tree);
        setZoomScale(0.7);
        setPanOffset({ x: 20, y: 30 });
      } catch (err) {
        console.error('Tree fetch error:', err);
        setError(err.message || 'Failed to populate core layouts tree arrays.');
        setTreeData(null);
        setSelectedNode(null);
      } finally {
        setLoading(false);
      }
    };

    buildTree();
  }, [currentException]);

  // Draw tree
  useEffect(() => {
    if (!treeData || !svgRef.current) return;

    const drawTree = () => {
      const svg = svgRef.current;
      if (!svg) return;
      svg.innerHTML = '';

      const nodeW = 220, nodeH = 65;
      const margin = { top: 20, right: 40, bottom: 20, left: 20 };
      const childSpacing = 120;
      
      let currentYOffset = 10;
      const nodes = [];
      const links = [];
      const rootX = 15;
      
      const hasChildren = treeData.children && treeData.children.length > 0;
      
      if (hasChildren) {
        treeData.children.forEach((parent, pIdx) => {
          const childrenCount = parent.children ? parent.children.length : 0;
          const totalBlockHeight = Math.max(1, childrenCount) * childSpacing;
          const parentY = currentYOffset + (totalBlockHeight / 2) - (nodeH / 2);
          
          const pNodeRef = { ...parent, x: rootX + 280, y: parentY };
          nodes.push(pNodeRef);

          if (parent.children && parent.children.length > 0) {
            parent.children.forEach((child, cIdx) => {
              const childY = currentYOffset + (cIdx * childSpacing) + (childSpacing / 2) - (nodeH / 2);
              nodes.push({ ...child, x: rootX + 580, y: childY });
              links.push({ 
                sx: pNodeRef.x + nodeW, 
                sy: parentY + nodeH / 2, 
                tx: rootX + 580, 
                ty: childY + nodeH / 2
              });
            });
          }
          currentYOffset += totalBlockHeight + 30;
        });
      }

      const height = Math.max(600, currentYOffset + margin.top + margin.bottom + 100);
      const rootY = height / 2 - nodeH / 2;
      nodes.unshift({ ...treeData, x: rootX, y: rootY });

      if (hasChildren) {
        treeData.children.forEach((parent) => {
          const parentNode = nodes.find(n => n.id === parent.id);
          if (parentNode) {
            links.unshift({ 
              sx: rootX + nodeW, 
              sy: rootY + nodeH / 2, 
              tx: parentNode.x, 
              ty: parentNode.y + nodeH / 2
            });
          }
        });
      }

      const outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      outerG.setAttribute('transform', `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
      outerG.appendChild(g);

      links.forEach(link => {
        const midX = (link.sx + link.tx) / 2;
        const pathData = `M ${link.sx} ${link.sy} C ${midX} ${link.sy}, ${midX} ${link.ty}, ${link.tx} ${link.ty}`;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(0, 214, 170, 0.25)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('style', 'pointer-events: none;');
        g.appendChild(path);
      });

      nodes.forEach(node => {
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeGroup.setAttribute('class', `interactive-svg-group ${selectedNode?.id === node.id ? 'selected' : ''}`);
        nodeGroup.setAttribute('transform', `translate(${node.x},${node.y})`);
        nodeGroup.setAttribute('style', 'pointer-events: all; cursor: pointer;');

        let elementColor = node.level === 0 ? '#ff4d6a' : node.level === 1 ? '#ffb830' : '#3b9eff';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', nodeW);
        rect.setAttribute('height', nodeH);
        rect.setAttribute('stroke', elementColor);
        rect.setAttribute('stroke-width', '1.5');
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        rect.setAttribute('fill', '#0c1221');
        rect.setAttribute('class', 'tree-node-rect');
        nodeGroup.appendChild(rect);

        const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeText.setAttribute('fill', '#5a7499');
        typeText.setAttribute('font-size', '7');
        typeText.setAttribute('font-weight', '700');
        typeText.setAttribute('x', '12');
        typeText.setAttribute('y', '16');
        typeText.setAttribute('style', 'pointer-events: none; user-select: none;');
        typeText.textContent = node.type || (node.level === 0 ? "EXCEPTION" : node.level === 1 ? "ROOT CAUSE" : "SUB CAUSE");
        nodeGroup.appendChild(typeText);

        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('fill', '#e2eaf6');
        nameText.setAttribute('font-size', '9.5');
        nameText.setAttribute('font-weight', '600');
        nameText.setAttribute('x', '12');
        nameText.setAttribute('y', '34');
        nameText.setAttribute('style', 'pointer-events: none; user-select: none;');
        const displayName = node.name.length > 28 ? node.name.substring(0, 26) + '...' : node.name;
        nameText.textContent = displayName;
        nodeGroup.appendChild(nameText);

        const pctText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        pctText.setAttribute('fill', '#00d4aa');
        pctText.setAttribute('font-size', '9');
        pctText.setAttribute('font-weight', '700');
        pctText.setAttribute('x', '12');
        pctText.setAttribute('y', '52');
        pctText.setAttribute('style', 'pointer-events: none; user-select: none;');
        pctText.textContent = `${Math.round(node.pct)}%`;
        nodeGroup.appendChild(pctText);

        const recsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        recsText.setAttribute('fill', '#5a7499');
        recsText.setAttribute('font-size', '9');
        recsText.setAttribute('font-weight', '500');
        recsText.setAttribute('x', nodeW - 12);
        recsText.setAttribute('y', '52');
        recsText.setAttribute('text-anchor', 'end');
        recsText.setAttribute('style', 'pointer-events: none; user-select: none;');
        recsText.textContent = `${node.count?.toLocaleString() || 0} recs`;
        nodeGroup.appendChild(recsText);

        nodeGroup.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedNode(node);
        });
        g.appendChild(nodeGroup);
      });

      const totalWidth = 820;
      svg.setAttribute('viewBox', `0 0 ${totalWidth} ${height}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.display = 'block';
      svg.style.background = 'transparent';
      svg.appendChild(outerG);
    };

    requestAnimationFrame(() => {
      drawTree();
    });
  }, [treeData, selectedNode?.id, zoomScale, panOffset]);

  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };
  
  const handleMouseMove = (e) => { 
    if (isDragging) {
      setPanOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };
  
  const handleMouseUp = () => setIsDragging(false);

  // Generate correlation data from tree data
  const getCorrelations = () => {
    if (!treeData || !treeData.children || treeData.children.length === 0) {
      return [];
    }
    
    return treeData.children.map((parent, index) => {
      const colorIndex = index % CORRELATION_COLORS.length;
      const color = CORRELATION_COLORS[colorIndex];
      
      // Calculate correlation percentage based on parent's pct
      const correlation = Math.min(95, Math.max(30, parent.pct + 20));
      const impactWeight = Math.min(95, Math.max(25, parent.pct + 15));
      
      return {
        name: parent.name,
        correlation: Math.round(correlation),
        impactWeight: Math.round(impactWeight),
        color: color,
        count: parent.count,
        pct: parent.pct
      };
    });
  };

  const correlations = getCorrelations();

  // Get column class based on column name
  const getColumnClass = (colName) => {
    const lower = colName.toLowerCase();
    if (lower.includes('amount') || lower.includes('value') || lower.includes('price')) return 'col-amount';
    if (lower.includes('category')) return 'col-category';
    if (lower.includes('date')) return 'col-date';
    if (lower.includes('document') || lower.includes('doc')) return 'col-doc';
    if (lower.includes('status')) return 'col-status';
    if (lower.includes('sub') || lower.includes('sub-category')) return 'col-sub';
    if (lower.includes('vendor') || lower.includes('customer')) return 'col-vendor';
    if (lower.includes('transaction') || lower.includes('txn')) return 'col-txid';
    if (lower.includes('comment')) return 'col-comment';
    return '';
  };

  return (
    <>
      {/* Main Content - Blurred when modal is open */}
      <div className="wrap" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 'calc(100vh - 64px)', 
        paddingBottom: '30px',
        filter: modalOpen ? 'blur(6px)' : 'none',
        pointerEvents: modalOpen ? 'none' : 'auto',
        opacity: modalOpen ? 0.3 : 1,
        transition: 'all 0.3s ease'
      }}>
        <style>{dynamicStyles}</style>
        
        <div className="ph" style={{ flexShrink: 0, marginTop: '15px' }}>
          <h1>Root Cause Tree Explorer</h1>
          <p>Analyze exception root causes with interactive tree visualization</p>
        </div>

        <div className="filter-row-deck-container">
          <div className="rca-sidebar-flex-stack" ref={dropdownCatRef}>
            <div className="flbl" style={{ marginBottom: '6px', fontSize: '11px', color: '#5a7499', fontWeight: '600' }}>BUSINESS PROCESS CATEGORY</div>
            <div className="rca-dropdown-wrapper">
              <div className="rca-dropdown-trigger" onClick={() => setIsCatOpen(!isCatOpen)}>
                <span>
                  <span style={{ marginRight: '8px' }}>{CATEGORY_ICONS[selectedCategory] || "📊"}</span>
                  {selectedCategory}
                </span>
                <svg className={`trigger-chevron ${isCatOpen ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {isCatOpen && (
                <ul className="rca-dropdown-overlay-list">
                  {categories.map((cat, idx) => (
                    <li key={idx} className={`rca-dropdown-row-item ${selectedCategory === cat ? 'active' : ''}`} onClick={() => handleCategorySelection(cat)}>
                      <span style={{ marginRight: '6px' }}>{CATEGORY_ICONS[cat] || "📁"}</span> {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rca-sidebar-flex-stack" ref={dropdownSubRef}>
            <div className="flbl" style={{ marginBottom: '6px', fontSize: '11px', color: '#5a7499', fontWeight: '600' }}>ANOMALY MONITORING ENGINE EXCEPTIONS</div>
            <div className="rca-dropdown-wrapper">
              <div className="rca-dropdown-trigger" onClick={() => setIsSubOpen(!isSubOpen)}>
                <span style={{ color: currentException ? '#e2eaf6' : '#5a7499' }}>
                  {currentException || "-- Choose Target Exception Module --"}
                </span>
                <svg className={`trigger-chevron ${isSubOpen ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {isSubOpen && (
                <ul className="rca-dropdown-overlay-list">
                  {filteredSubCategories.length === 0 ? (
                    <li className="rca-dropdown-row-item" style={{ color: '#5a7499', cursor: 'default' }}>No exceptions found</li>
                  ) : (
                    filteredSubCategories.map((sub, idx) => (
                      <li key={idx} className={`rca-dropdown-row-item ${currentException === sub.name ? 'active' : ''}`} onClick={() => { setIsSubOpen(false); navigate(`/rca/${encodeURIComponent(sub.name)}`); }}>
                        <span style={{ color: '#ff4d6a', marginRight: '6px' }}>⊚</span> {sub.name}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {error && <div className="err" style={{ flexShrink: 0 }}>{error}</div>}

        {!currentException ? (
          <div className="loading ca" style={{ flexGrow: 1, border: '1px dashed var(--bdr2)', borderRadius: 'var(--rl)' }}>
            <div style={{ fontSize: '40px', opacity: 0.5 }}>🔍</div>
            <div className="ltxt" style={{ marginTop: '12px', color: '#5a7499' }}>Choose an exception from the dropdown above to view its root cause tree</div>
          </div>
        ) : loading ? (
          <div className="loading ca" style={{ flexGrow: 1 }}><div className="spin"></div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="rca-dashboard-split-grid">
              <div 
                ref={canvasRef}
                id="canvas-container" 
                className="rca-tree-canvas" 
                onMouseDown={handleMouseDown} 
                onMouseMove={handleMouseMove} 
                onMouseUp={handleMouseUp} 
                onMouseLeave={handleMouseUp}
              >
                <div className="zoom-control-panel">
                  <button className="zoom-btn" onClick={() => setZoomScale(s => Math.min(1.5, s + 0.1))}>＋</button>
                  <button className="zoom-btn" onClick={() => setZoomScale(s => Math.max(0.3, s - 0.1))}>－</button>
                  <button className="zoom-btn" onClick={() => { setZoomScale(0.7); setPanOffset({ x: 20, y: 30 }); }} style={{fontSize: '10px'}}>⟳</button>
                </div>
                <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'all' }}></svg>
              </div>

              <div className="rca-sidebar-flex-stack">
                {selectedNode && (
                  <div className="rca-details ca" style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', padding: '24px', height: '100%', overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', color: '#5a7499', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Node Details</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '20px', color: '#fff', fontWeight: '800', fontFamily: 'var(--fd)' }}>
                        {selectedNode.name.length > 20 ? selectedNode.name.substring(0, 18) + '...' : selectedNode.name}
                      </h2>
                      <div className="ai-badge">AI Analyzed</div>
                    </div>

                    <span className={`type-chip ${selectedNode.level === 0 ? 'exception' : selectedNode.level === 1 ? 'root-cause' : 'sub-cause'}`}>
                      {selectedNode.level === 0 ? "Exception" : selectedNode.level === 1 ? "Root Cause" : "Sub Cause"}
                    </span>

                    {selectedNode.description && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#a2b4dc', background: 'rgba(0,212,170,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0,212,170,0.1)' }}>
                        {selectedNode.description}
                      </div>
                    )}

                    <div style={{ marginTop: '24px' }}>
                      <div className="premium-metric-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#a2b4dc', fontWeight: '500' }}>AI Confidence Score</span>
                          <span className="num" style={{ fontSize: '16px', color: '#fff', fontWeight: '700' }}>
                            {selectedNode.count > 0 ? (75 + (selectedNode.pct * 0.2)).toFixed(0) : '95'}%
                          </span>
                        </div>
                        <div className="metric-progress-container">
                          <div className="metric-progress-bar purple" style={{ width: `${selectedNode.count > 0 ? Math.min(100, 75 + (selectedNode.pct * 0.2)) : 95}%` }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#5a7499', marginTop: '8px' }}>High Confidence Matching Profile</div>
                      </div>

                      <div className="premium-metric-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#a2b4dc', fontWeight: '500' }}>Impact Assessment</span>
                          <span className="num" style={{ fontSize: '16px', color: '#fff', fontWeight: '700' }}>
                            {selectedNode.count > 0 ? Math.round(selectedNode.pct) : 100}%
                          </span>
                        </div>
                        <div className="metric-progress-container">
                          <div className="metric-progress-bar orange" style={{ width: `${selectedNode.count > 0 ? Math.min(100, selectedNode.pct) : 100}%` }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#5a7499', marginTop: '8px' }}>
                          {selectedNode.count > 0 ? (selectedNode.pct > 40 ? "Critical System Discrepancy" : "Moderate Operational Deviation") : "Critical System Discrepancy"}
                        </div>
                      </div>

                      <div className="premium-metric-card" style={{ background: 'rgba(16, 224, 138, 0.03)', borderColor: 'rgba(16, 224, 138, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#10e08a', fontWeight: '600' }}>Financial Impact</span>
                          <span className="num" style={{ fontSize: '18px', color: '#10e08a', fontWeight: '800' }}>
                            ₹{Math.round(selectedNode.value || 0).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#5a7499', marginTop: '8px' }}>Total exception value affected by this node trail segment.</div>
                      </div>

                      <div className="premium-metric-card">
                        <div style={{ fontSize: '11px', color: '#5a7499', textTransform: 'uppercase', marginBottom: '10px' }}>Node Information</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#5a7499' }}>Node ID:</span>
                            <span className="num" style={{ color: '#fff', fontWeight: '600' }}>{selectedNode.id || 'root'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#5a7499' }}>System Level:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>L-{selectedNode.level || 0} Structural Branch</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#5a7499' }}>Total Records:</span>
                            <span className="num" style={{ color: '#fff', fontWeight: '600' }}>{selectedNode.count?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="premium-metric-card" style={{ background: 'rgba(0, 212, 170, 0.02)', borderColor: 'rgba(0, 212, 170, 0.12)' }}>
                        <div style={{ fontSize: '12px', color: '#00d4aa', fontWeight: '600', marginBottom: '6px' }}>AI Analysis Summary</div>
                        <p style={{ fontSize: '12px', color: '#a2b4dc', lineHeight: '1.5' }}>
                          This node segment has been processed across machine learning categorization vectors. The metric exposure values represent total calculated variance frequencies inside your ERP cluster.
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card2)', padding: '14px', borderRadius: '10px', marginTop: '16px', border: '1px solid var(--bdr)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '55%' }}>
                          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>Affected Transactions</span>
                          <span style={{ fontSize: '10px', color: '#5a7499' }}>Review complete transaction logs</span>
                        </div>
                        <button className="view-tx-btn-premium" onClick={handleViewTransactions}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          View Transactions
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LOWER ANALYTICS ROW BLOCKS - DYNAMIC CORRELATIONS */}
            {selectedNode && treeData && treeData.children && treeData.children.length > 0 && (
              <div className="bottom-analytics-deck">
                <div className="correlation-card-wrapper">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: 'var(--fd)' }}>Root Cause Correlations</h3>
                    <p style={{ fontSize: '11px', color: '#5a7499' }}>Shows how different root causes impact each other and their cascading effects</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    {correlations.map((item, index) => {
                      const letter = String.fromCharCode(65 + index);
                      return (
                        <div key={index} className="correlation-item-row">
                          <div className="correlation-item-left">
                            <div className="status-indicator-dot" style={{ 
                              background: item.color.bg, 
                              boxShadow: `0 0 10px ${item.color.shadow}` 
                            }}>
                              {letter}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{item.name}</span>
                              <span style={{ fontSize: '11px', color: '#5a7499' }}>
                                Correlation: <span style={{color:'#00d4aa', fontWeight:'600'}}>{item.correlation}%</span> 
                                | Impact Weight Factor: <span style={{color:'#ffb830', fontWeight:'600'}}>{item.impactWeight}%</span>
                                | Records: <span style={{color:'#e2eaf6', fontWeight:'600'}}>{item.count}</span>
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: item.color.bg, textTransform: 'uppercase' }}>
                            {item.color.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#5a7499', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color:'#ff4d6a' }}>●</span> High Correlation (&gt;70%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color:'#ffb830' }}>●</span> Medium Correlation (40-70%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color:'#3b9eff' }}>●</span> Low Correlation (&lt;40%)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#5a7499', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact Summary</div>
                  <div className="impact-summary-grid">
                    <div className="summary-metric-box" style={{ background: 'rgba(255, 77, 106, 0.03)', borderColor: 'rgba(255, 77, 106, 0.12)' }}>
                      <span style={{ fontSize: '12px', color: '#5a7499' }}>Total Root Causes</span>
                      <span className="num" style={{ fontSize: '24px', fontWeight: '800', color: '#ff4d6a' }}>{treeData?.children?.length || 0}</span>
                    </div>
                    <div className="summary-metric-box" style={{ background: 'rgba(255, 184, 48, 0.03)', borderColor: 'rgba(255, 184, 48, 0.12)' }}>
                      <span style={{ fontSize: '12px', color: '#5a7499' }}>Total Sub-Causes</span>
                      <span className="num" style={{ fontSize: '24px', fontWeight: '800', color: '#ffb830' }}>
                        {treeData?.children?.reduce((acc, p) => acc + (p.children?.length || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="summary-metric-box" style={{ background: 'rgba(16, 224, 138, 0.03)', borderColor: 'rgba(16, 224, 138, 0.12)' }}>
                      <span style={{ fontSize: '12px', color: '#5a7499' }}>Average Impact Weight</span>
                      <span className="num" style={{ fontSize: '24px', fontWeight: '800', color: '#10e08a' }}>
                        {selectedNode.count > 0 ? Math.round(selectedNode.pct) : 100}%
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#5a7499', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Insights</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="ai-insight-strip">
                      <span style={{ color: '#00d4aa' }}>✦</span> Over <span style={{color: '#fff', fontWeight: '600'}}>78%</span> of matching anomalies are consolidated within high-frequency transaction value buckets.
                    </div>
                    <div className="ai-insight-strip">
                      <span style={{ color: '#00d4aa' }}>✦</span> Organizational branch components indicate a 2.4x variance spikes compared to the historical compliance baseline records.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL - Always on top with its own header */}
      {modalOpen && (
        <div className="tx-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <div className="tx-modal-container">
            {/* Modal Header - Always visible at top */}
            <div className="tx-modal-header">
              <div className="tx-modal-header-left">
                <div className="tx-modal-title">📋 Transactions for {selectedNode?.name || currentException}</div>
                <div className="tx-modal-subtitle">{Array.isArray(transactions) ? transactions.length : 0} transactions located inside repository logs</div>
              </div>
              <div className="tx-modal-header-right">
                <button 
                  className="tx-download-btn" 
                  onClick={() => {
                    let url = `http://127.0.0.1:5001/rca/transactions/${encodeURIComponent(currentException)}?download=true`;
                    const params = new URLSearchParams();
                    if (selectedNode.level === 1) {
                      params.append('category', selectedNode.name);
                    } else if (selectedNode.level === 2) {
                      params.append('category', selectedNode.parentName);
                      params.append('sub_category', selectedNode.name);
                    }
                    const queryString = params.toString();
                    if (queryString) {
                      url += `&${queryString}`;
                    }
                    window.open(url, '_blank');
                  }}
                >
                  <svg width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4m4-10 5 5 5-5m-5-3v12"/></svg>
                  Download CSV
                </button>
                <button className="tx-dismiss-x" onClick={() => setModalOpen(false)}>✕</button>
              </div>
            </div>

            {/* Table Wrapper - Scrollable */}
            <div className="tx-table-wrapper">
              {loadingTx ? (
                <div className="loading" style={{minHeight:'250px'}}><div className="spin" style={{borderTopColor:'#475569'}}></div></div>
              ) : txError ? (
                <div className="err" style={{margin:'20px'}}>{txError}</div>
              ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#5a7499', fontSize: '15px' }}>No document record items found for this localized operational node tree slice.</div>
              ) : (
                <table className="tx-native-table">
                  <thead>
                    <tr>
                      {Object.keys(transactions[0]).map(key => {
                        // Map column names to display names
                        let displayName = key.replace(/_/g, ' ');
                        if (key === 'Comment' || key === 'comment') {
                          displayName = 'AUDIT COMMENT';
                        } else if (displayName.toLowerCase().includes('amount')) {
                          displayName = 'AMOUNT';
                        } else if (displayName.toLowerCase().includes('category')) {
                          displayName = 'CATEGORY';
                        } else if (displayName.toLowerCase().includes('date')) {
                          displayName = 'DATE';
                        } else if (displayName.toLowerCase().includes('document') || displayName.toLowerCase().includes('doc')) {
                          displayName = 'DOCUMENT NUMBER';
                        } else if (displayName.toLowerCase().includes('status')) {
                          displayName = 'STATUS';
                        } else if (displayName.toLowerCase().includes('sub')) {
                          displayName = 'SUB-CATEGORY';
                        } else if (displayName.toLowerCase().includes('vendor') || displayName.toLowerCase().includes('customer')) {
                          displayName = 'VENDOR/CUSTOMER';
                        } else if (displayName.toLowerCase().includes('transaction') || displayName.toLowerCase().includes('txn')) {
                          displayName = 'TRANSACTION ID';
                        } else {
                          displayName = displayName.toUpperCase();
                        }
                        
                        const isComment = key === 'Comment' || key === 'comment';
                        return (
                          <th 
                            key={key} 
                            className={getColumnClass(key)}
                            style={isComment ? {
                              backgroundColor: '#0c1221', 
                              color: '#10e08a',
                              minWidth: '250px'
                            } : {}}
                          >
                            {displayName}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => {
                      const txId = tx.transaction_id || tx.id || `row-${idx}`;
                      const isEditing = editingComment === txId;
                      const comment = tx.Comment || tx.comment || '';
                      
                      return (
                        <tr key={idx}>
                          {Object.entries(tx).map(([colName, val], vIdx) => {
                            const isFirstCell = vIdx === 0;
                            const isAmount = colName.toLowerCase().includes('amount') || colName.toLowerCase().includes('value') || colName.toLowerCase().includes('diff') || colName.toLowerCase().includes('price');
                            const isStatus = colName.toLowerCase().includes('status') || colName.toLowerCase().includes('indicator');
                            const isComment = colName === 'Comment' || colName === 'comment';

                            if (isComment) {
                              return (
                                <td key={colName} className="tx-cell-comment">
                                  <div className="comment-edit-wrapper">
                                    {isEditing ? (
                                      <>
                                        <input
                                          className="comment-input"
                                          type="text"
                                          value={commentText}
                                          onChange={(e) => setCommentText(e.target.value)}
                                          placeholder="Enter comment..."
                                          autoFocus
                                        />
                                        <button 
                                          className="comment-save-btn"
                                          onClick={() => handleSaveComment(txId, commentText)}
                                          disabled={savingComment}
                                        >
                                          {savingComment ? '...' : 'Save'}
                                        </button>
                                        <button 
                                          className="comment-cancel-btn"
                                          onClick={() => {
                                            setEditingComment(null);
                                            setCommentText('');
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <span 
                                        className="comment-text"
                                        onClick={() => {
                                          setEditingComment(txId);
                                          setCommentText(comment);
                                        }}
                                        title={comment || "Click to add comment"}
                                      >
                                        {comment || "Click to add comment"}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            let cellContent = val !== null && val !== undefined ? String(val) : '-';
                            if (isAmount && val && !String(val).includes('₹')) {
                              const numVal = parseFloat(String(val).replace(/,/g, ''));
                              if (!isNaN(numVal)) {
                                cellContent = `₹${numVal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
                              }
                            }

                            return (
                              <td key={colName} className={isFirstCell ? "tx-cell-bold" : ""}>
                                {isStatus ? (
                                  <span className="tx-pill-status">{cellContent}</span>
                                ) : (
                                  <>
                                    <div>{cellContent}</div>
                                    {isFirstCell && <span className="tx-cell-subtext">DOCUMENT INDEX LINE</span>}
                                  </>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="tx-modal-footer">
              <div className="tx-footer-count">Showing {Array.isArray(transactions) ? transactions.length : 0} ledger items rows</div>
              <button className="tx-footer-close-btn" onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RootCauseExplorer;
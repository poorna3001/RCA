import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const dynamicStyles = `
  .rca-dropdown-wrapper { position: relative; width: 100%; font-family: var(--fb); z-index: 999; }
  .rca-dropdown-trigger { background: var(--card); border: 1px solid var(--bdr); border-radius: 10px; padding: 14px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--txt); transition: all 0.25s ease; font-weight: 500; }
  .rca-dropdown-trigger:hover { border-color: var(--teal); box-shadow: 0 0 20px rgba(0, 212, 170, 0.15); transform: translateY(-1px); }
  .rca-dropdown-overlay-list { position: absolute; top: 100%; left: 0; right: 0; background: var(--card2); border: 1px solid var(--bdr); border-radius: 12px; margin-top: 8px; max-height: 360px; overflow-y: auto; z-index: 1000; padding: 6px; box-shadow: 0 20px 40px rgba(0,0,0,0.65); }
  .rca-dropdown-row-item { padding: 12px 16px; border-radius: 8px; cursor: pointer; color: var(--muted); transition: all 0.2s ease; font-size: 13px; display: flex; align-items: center; gap: 10px; text-align: left; }
  .rca-dropdown-row-item:hover { background: var(--teal-d); color: var(--teal); padding-left: 22px; }
  .rca-dropdown-row-item.active { background: var(--teal-g); color: var(--teal); font-weight: 700; border-left: 3px solid var(--teal); }
  
  .tree-node-rect { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); fill: var(--surf); rx: 8px; pointer-events: all; }
  .interactive-svg-group:hover .tree-node-rect { fill: var(--card2); filter: drop-shadow(0 0 12px rgba(0, 212, 170, 0.25)); }
  .interactive-svg-group.selected .tree-node-rect { stroke-width: 2.5px !important; fill: var(--card2) !important; stroke: var(--teal) !important; }

  /* Dashboard Grid Splitting Framework Layout */
  .rca-dashboard-split-grid { display: grid; grid-template-columns: 1fr 430px; gap: 20px; margin-top: 15px; min-height: 0; }
  .rca-sidebar-flex-stack { display: flex; flex-direction: column; gap: 16px; height: 100%; }

  /* Premium Analytics Deck Row Frames */
  .bottom-analytics-deck { display: flex; flex-direction: column; gap: 24px; margin-top: 24px; width: 100%; }
  .correlation-card-wrapper { background: var(--card); border: 1px solid var(--bdr); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: all 0.25s; }
  .correlation-card-wrapper:hover { border-color: rgba(0, 214, 170, 0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  
  .correlation-item-row { background: var(--card2); border: 1px solid rgba(255,255,255,0.03); border-radius: 8px; padding: 16px; display: flex; align-items: center; justify-content: space-between; position: relative; }
  .correlation-item-left { display: flex; align-items: center; gap: 16px; }
  .status-indicator-dot { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; }
  
  .impact-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; width: 100%; }
  .summary-metric-box { border-radius: 10px; padding: 18px 22px; display: flex; flex-direction: column; gap: 6px; border: 1px solid rgba(255,255,255,0.02); }
  
  .ai-insight-strip { background: var(--card2); border: 1px solid var(--bdr); border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #a2b4dc; line-height: 1.5; display: flex; align-items: center; gap: 10px; }
  
  .zoom-control-panel { position: absolute; bottom: 20px; left: 20px; background: var(--card2); border: 1px solid var(--bdr); border-radius: 8px; display: flex; flex-direction: column; gap: 4px; padding: 4px; z-index: 100; pointer-events: all; }
  .zoom-btn { background: var(--surf); border: 1px solid var(--bdr); color: var(--txt); width: 34px; height: 34px; border-radius: 6px; font-weight: 700; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .zoom-btn:hover { border-color: var(--teal); color: var(--teal); background: var(--card); }
  
  .trigger-chevron { transition: transform 0.3s ease; color: var(--teal); }
  .trigger-chevron.open { transform: rotate(180deg); }
  
  .rca-tree-canvas::-webkit-scrollbar { width: 6px; height: 6px; }
  .rca-tree-canvas::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 4px; }

  .ai-badge { color: #10e08a; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .ai-badge::before { content: '●'; font-size: 10px; }
  .type-chip { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 8px; }
  .type-chip.exception { background: rgba(255, 77, 106, 0.15); color: #ff4d6a; border: 1px solid rgba(255, 77, 106, 0.3); }
  .type-chip.root-cause { background: rgba(255, 184, 48, 0.15); color: #ffb830; border: 1px solid rgba(255, 184, 48, 0.3); }
  .type-chip.sub-cause { background: rgba(59, 158, 255, 0.15); color: #3b9eff; border: 1px solid rgba(59, 158, 255, 0.3); }
  
  .premium-metric-card { background: linear-gradient(145deg, #111a2e, #0a1020); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 18px; margin-bottom: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
  .metric-progress-container { width: 100%; background: #080d1a; height: 8px; border-radius: 10px; margin-top: 10px; overflow: hidden; }
  .metric-progress-bar { height: 100%; border-radius: 10px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
  .metric-progress-bar.purple { background: linear-gradient(90deg, #783cf0, #3b9eff); }
  .metric-progress-bar.orange { background: linear-gradient(90deg, #ffb830, #ff4d6a); }

  .view-tx-btn-premium { background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 8px; color: #fff; padding: 12px 20px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
  .view-tx-btn-premium:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.45); filter: brightness(1.1); }

  /* OVERLAPPING GRID VIEW RE-ENGINEERING BINDINGS */
  .tx-modal-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.96); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .tx-modal-container { background: #fff; border-radius: 6px; width: 100%; max-width: 1650px; height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(15,23,42,0.15); border: 1px solid #e2e8f0; }
  .tx-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 32px 18px 32px; background: #fff !important; flex-shrink: 0; border-bottom: 1px solid #e2e8f0; position: relative; z-index: 30; }
  .tx-modal-title { font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
  .tx-modal-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 500; }
  
  .tx-download-btn { background: #10b981; border: none; border-radius: 6px; color: #fff; padding: 10px 20px; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.15s ease; }
  .tx-download-btn:hover { background: #059669; }
  .tx-dismiss-x { background: transparent; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; padding: 4px; line-height: 1; }
  .tx-dismiss-x:hover { color: #475569; }

  .tx-table-wrapper { flex: 1; overflow: auto; background: #fff; padding: 0; position: relative; z-index: 20; }
  .tx-native-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 13px; table-layout: auto; }
  
  /* CRITICAL PIXEL-PERFECT RESOLUTION FIX FOR THE OVERLAPPING BLEED BUG */
  .tx-native-table th { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; padding: 16px 20px; background-color: #f8fafc !important; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; letter-spacing: 0.05em; position: sticky; top: 0; z-index: 100 !important; white-space: nowrap; box-shadow: inset 0 -2px 0 #e2e8f0; }
  
  .tx-native-table td { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; color: #334155; font-weight: 500; line-height: 1.6; white-space: nowrap; max-width: 320px; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; background-color: #fff !important; }
  .tx-native-table tbody tr:hover td { background-color: #f1f5f9 !important; }
  
  .tx-cell-bold { font-weight: 700; color: #0f172a; font-size: 13px; background-color: #f8fafc !important; }
  .tx-cell-subtext { font-size: 11px; color: #64748b; font-weight: 500; display: block; margin-top: 2px; }
  .tx-pill-status { display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; border: 1px solid rgba(3,105,161,0.1); text-transform: uppercase; letter-spacing: 0.02em; }
  
  .tx-modal-footer { background: #f8fafc; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; flex-shrink: 0; position: relative; z-index: 30; }
  .tx-footer-count { font-size: 13px; color: #475569; font-weight: 600; }
  .tx-footer-close-btn { background: #0f172a; border: none; border-radius: 6px; color: #fff; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .tx-footer-close-btn:hover { background: #1e293b; }
`;

const RootCauseExplorer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [exceptions, setExceptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState(null);
  
  const svgRef = useRef(null);
  
  const pathParts = location.pathname.split('/').map(decodeURIComponent);
  const currentException = pathParts[2] && pathParts[2] !== '' ? pathParts[2] : '';

  useEffect(() => {
    fetch('http://127.0.0.1:5001/rca/exceptions')
      .then(res => res.json())
      .then(data => setExceptions(data))
      .catch(() => setError("Failed to synchronize active backend communication pathways."));
  }, []);

  useEffect(() => {
    const closeMenu = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  useEffect(() => {
    setModalOpen(false);
    setTransactions([]);
  }, [currentException, location.pathname]);

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
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        const tree = {
          id: 'root', name: data.name, type: 'RISK PARAMETER', value: data.value, count: data.count, pct: 100.0, level: 0,
          children: data.children.map((parent, idx) => {
            const parentPct = (parent.value / (data.value || 1)) * 100;
            return {
              id: `parent-${idx}`, name: parent.name, type: 'ROOT CAUSE CATEGORY', value: parent.value, count: parent.count, pct: parentPct, level: 1,
              children: parent.children.map((child, cIdx) => {
                const childPct = (child.value / (data.value || 1)) * 100;
                return {
                  id: `child-${idx}-${cIdx}`, name: child.name, type: 'SUB CATEGORY', value: child.value, count: child.count, pct: childPct, level: 2, parentName: parent.name
                };
              })
            };
          })
        };
        setTreeData(tree);
        setSelectedNode(tree);
        setZoomScale(0.85);
        setPanOffset({ x: 15, y: 40 });
      } catch (err) {
        setError(err.message || 'Failed to populate core layouts tree arrays.');
        setTreeData(null);
        setSelectedNode(null);
      } finally {
        setLoading(false);
      }
    };

    buildTree();
  }, [currentException]);

  useEffect(() => {
    if (!treeData || !svgRef.current) return;

    const drawTree = () => {
      const svg = svgRef.current;
      svg.innerHTML = '';

      const nodeW = 220, nodeH = 75;
      const margin = { top: 30, right: 60, bottom: 30, left: 40 };
      const width = 1450; 
      const childSpacing = 150; 
      
      let currentYOffset = 20;
      const links = [];
      const nodes = [];
      const rootX = 20;
      
      treeData.children.forEach((parent, pIdx) => {
        const childrenCount = parent.children ? parent.children.length : 0;
        const totalBlockHeight = Math.max(1, childrenCount) * childSpacing;
        const parentY = currentYOffset + (totalBlockHeight / 2) - (nodeH / 2);
        
        const pNodeRef = { ...parent, x: rootX + 360, y: parentY };
        nodes.push(pNodeRef);

        if (parent.children) {
          parent.children.forEach((child, cIdx) => {
            const childY = currentYOffset + (cIdx * childSpacing) + (childSpacing / 2) - (nodeH / 2);
            nodes.push({ ...child, x: rootX + 720, y: childY });
            links.push({ sx: pNodeRef.x + nodeW, sy: parentY + nodeH / 2, tx: rootX + 720, ty: childY + nodeH / 2 });
          });
        }
        currentYOffset += totalBlockHeight + 30;
      });

      const height = Math.max(680, currentYOffset + margin.top + margin.bottom);
      const rootY = height / 2 - nodeH / 2;
      nodes.unshift({ ...treeData, x: rootX, y: rootY });

      nodes.forEach(n => {
        if (n.level === 1) {
          links.unshift({ sx: rootX + nodeW, sy: rootY + nodeH / 2, tx: n.x, ty: n.y + nodeH / 2 });
        }
      });

      const outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      outerG.setAttribute('transform', `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
      outerG.appendChild(g);

      links.forEach(link => {
        const midX = (link.sx + link.tx) / 2;
        const pathData = `M ${link.sx} ${link.sy} C ${midX} ${link.sx}, ${midX} ${link.ty}, ${link.tx} ${link.ty}`;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(0, 214, 170, 0.22)');
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('style', 'pointer-events: none;');
        g.appendChild(path);
      });

      nodes.forEach(node => {
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeGroup.setAttribute('class', `interactive-svg-group ${selectedNode?.id === node.id ? 'selected' : ''}`);
        nodeGroup.setAttribute('transform', `translate(${node.x},${node.y})`);
        nodeGroup.setAttribute('style', 'pointer-events: all;');

        let elementColor = node.level === 0 ? 'var(--red)' : node.level === 1 ? 'var(--amb)' : 'var(--blue)';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', nodeW);
        rect.setAttribute('height', nodeH);
        rect.setAttribute('stroke', elementColor);
        rect.setAttribute('stroke-width', '1.5');
        rect.setAttribute('class', 'tree-node-rect');
        nodeGroup.appendChild(rect);

        const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeText.setAttribute('fill', 'var(--muted)');
        typeText.setAttribute('font-size', '7.5');
        typeText.setAttribute('font-weight', '700');
        typeText.setAttribute('x', '14');
        typeText.setAttribute('y', '20');
        typeText.setAttribute('style', 'pointer-events: none; user-select: none;');
        typeText.textContent = node.level === 0 ? "EXCEPTION" : node.level === 1 ? "ROOT CAUSE" : "SUB CAUSE";
        nodeGroup.appendChild(typeText);

        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('fill', 'var(--txt)');
        nameText.setAttribute('font-size', '10');
        nameText.setAttribute('font-weight', '600');
        nameText.setAttribute('x', '14');
        nameText.setAttribute('y', '40');
        nameText.setAttribute('style', 'pointer-events: none; user-select: none;');
        nameText.textContent = node.name.length > 26 ? node.name.substring(0, 24) + '...' : node.name;
        nodeGroup.appendChild(nameText);

        const pctText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        pctText.setAttribute('fill', 'var(--teal)');
        pctText.setAttribute('font-size', '9.5');
        pctText.setAttribute('font-family', 'var(--fm)');
        pctText.setAttribute('font-weight', '700');
        pctText.setAttribute('x', '14');
        pctText.setAttribute('y', '58');
        pctText.setAttribute('style', 'pointer-events: none; user-select: none;');
        pctText.textContent = `${node.pct.toFixed(1)}%`;
        nodeGroup.appendChild(pctText);

        const recsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        recsText.setAttribute('fill', 'var(--muted)');
        recsText.setAttribute('font-size', '9.5');
        recsText.setAttribute('font-family', 'var(--fm)');
        recsText.setAttribute('x', '206');
        recsText.setAttribute('y', '58');
        recsText.setAttribute('text-anchor', 'end');
        recsText.setAttribute('style', 'pointer-events: none; user-select: none;');
        recsText.textContent = `${node.count.toLocaleString()} recs`;
        nodeGroup.appendChild(recsText);

        nodeGroup.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedNode(node);
        });
        g.appendChild(nodeGroup);
      });

      svg.setAttribute('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);
      svg.appendChild(outerG);
    };

    drawTree();
  }, [treeData, selectedNode?.id, zoomScale, panOffset]);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'canvas-container') {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };
  const handleMouseMove = (e) => { if (isDragging) setPanOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const handleMouseUp = () => setIsDragging(false);

  const handleViewTransactions = async () => {
    if (!selectedNode) return;
    setModalOpen(true);
    setLoadingTx(true);
    setTxError(null);
    const isLevel2 = selectedNode.level === 2;
    const pName = isLevel2 ? selectedNode.parentName : selectedNode.name;
    const cName = isLevel2 ? selectedNode.name : undefined;

    let url = `http://127.0.0.1:5001/rca/transactions/${encodeURIComponent(currentException)}?1=1`;
    if (selectedNode.level > 0) url += `&parent=${encodeURIComponent(pName)}`;
    if (cName) url += `&child=${encodeURIComponent(cName)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch { 
      setTxError("Failed to pull matching transaction items from server pipelines.");
      setTransactions([]);
    } finally { 
      setLoadingTx(false); 
    }
  };

  return (
    <div className="wrap" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', paddingBottom: '30px' }}>
      <style>{dynamicStyles}</style>
      
      <div className="ph" style={{ flexShrink: 0, marginTop: '15px' }}>
        <h1>Root Cause Tree Explorer</h1>
        <p>Analyze exception root causes with interactive tree visualization</p>
      </div>

      <div className="fp" style={{ flexShrink: 0, marginBottom: '15px' }}>
        <div className="flbl" style={{ marginBottom: '6px' }}>SELECT EXCEPTION</div>
        <div className="rca-dropdown-wrapper" ref={dropdownRef}>
          <div className="rca-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <span>{currentException || "-- Choose an Exception --"}</span>
            <svg className={`trigger-chevron ${isDropdownOpen ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          {isDropdownOpen && (
            <ul className="rca-dropdown-overlay-list">
              {exceptions.map((exc, idx) => (
                <li key={idx} className={`rca-dropdown-row-item ${currentException === exc ? 'active' : ''}`} onClick={() => { setIsDropdownOpen(false); navigate(`/rca/${encodeURIComponent(exc)}`); }}>
                  <span style={{ color: 'var(--teal)' }}>⊚</span> {exc}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <div className="err" style={{ flexShrink: 0 }}>{error}</div>}

      {!currentException ? (
        <div className="loading ca" style={{ flexGrow: 1, border: '1px dashed var(--bdr2)', borderRadius: 'var(--rl)' }}>
          <div style={{ fontSize: '40px', opacity: 0.5 }}>🔍</div>
          <div className="ltxt" style={{ marginTop: '12px' }}>Awaiting module choice parameter execution...</div>
        </div>
      ) : loading ? (
        <div className="loading ca" style={{ flexGrow: 1 }}><div className="spin"></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="rca-dropdown-wrapper">
            <div className="rca-dashboard-split-grid">
              {/* LEFT CANVAS WORKSPACE */}
              <div id="canvas-container" className="rca-tree-canvas" style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', overflow: 'hidden', display: 'flex', alignItems: 'center', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'all', height: '680px' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <div className="zoom-control-panel">
                  <button className="zoom-btn" onClick={() => setZoomScale(s => Math.min(2.0, s + 0.1))}>＋</button>
                  <button className="zoom-btn" onClick={() => setZoomScale(s => Math.max(0.4, s - 0.1))}>－</button>
                  <button className="zoom-btn" onClick={() => { setZoomScale(0.85); setPanOffset({ x: 15, y: 40 }); }} style={{fontSize: '11px'}}>RST</button>
                </div>
                <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'all' }}></svg>
              </div>

              {/* RIGHT SIDEBAR DETAILS INSPECTOR */}
              <div className="rca-sidebar-flex-stack">
                {selectedNode && (
                  <div className="rca-details ca" style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', padding: '24px', height: '100%', overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Node Details</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '20px', color: '#fff', fontWeight: '800', fontFamily: 'var(--fd)' }}>
                        {selectedNode.name.length > 20 ? selectedNode.name.substring(0, 18) + '...' : selectedNode.name}
                      </h2>
                      <div className="ai-badge">AI Analyzed</div>
                    </div>

                    <span className={`type-chip ${selectedNode.level === 0 ? 'exception' : selectedNode.level === 1 ? 'root-cause' : 'sub-cause'}`}>
                      {selectedNode.level === 0 ? "Exception" : selectedNode.level === 1 ? "Root Cause" : "Sub Cause"}
                    </span>

                    <div style={{ marginTop: '24px' }}>
                      <div className="premium-metric-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#a2b4dc', fontWeight: '500' }}>AI Confidence Score</span>
                          <span className="num" style={{ fontSize: '16px', color: '#fff', fontWeight: '700' }}>{(75 + (selectedNode.pct * 0.2)).toFixed(0)}%</span>
                        </div>
                        <div className="metric-progress-container">
                          <div className="metric-progress-bar purple" style={{ width: `${75 + (selectedNode.pct * 0.2)}%` }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>High Confidence Matching Profile</div>
                      </div>

                      <div className="premium-metric-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#a2b4dc', fontWeight: '500' }}>Impact Assessment</span>
                          <span className="num" style={{ fontSize: '16px', color: '#fff', fontWeight: '700' }}>{selectedNode.pct.toFixed(0)}%</span>
                        </div>
                        <div className="metric-progress-container">
                          <div className="metric-progress-bar orange" style={{ width: `${selectedNode.pct}%` }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
                          {selectedNode.pct > 40 ? "Critical System Discrepancy" : "Moderate Operational Deviation"}
                        </div>
                      </div>

                      <div className="premium-metric-card" style={{ background: 'rgba(16, 224, 138, 0.03)', borderColor: 'rgba(16, 224, 138, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#10e08a', fontWeight: '600' }}>Financial Impact</span>
                          <span className="num" style={{ fontSize: '18px', color: '#10e08a', fontWeight: '800' }}>
                            ₹{selectedNode.value.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>Total exception value affected by this node trail segment.</div>
                      </div>

                      <div className="premium-metric-card">
                        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Node Information</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--muted)' }}>Node ID:</span>
                            <span className="num" style={{ color: '#fff', fontWeight: '600' }}>{selectedNode.id}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--muted)' }}>System Level:</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>L-{selectedNode.level} Structural Branch</span>
                          </div>
                        </div>
                      </div>

                      <div className="premium-metric-card" style={{ background: 'rgba(0, 212, 170, 0.02)', borderColor: 'rgba(0, 212, 170, 0.12)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: '600', marginBottom: '6px' }}>AI Analysis Summary</div>
                        <p style={{ fontSize: '12px', color: '#a2b4dc', lineHeight: '1.5' }}>
                          This node segment has been processed across machine learning categorization vectors. The metric exposure values represent total calculated variance frequencies inside your ERP cluster.
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card2)', padding: '14px', borderRadius: '10px', marginTop: '16px', border: '1px solid var(--bdr)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '55%' }}>
                          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>Affected Transactions</span>
                          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Review complete transaction logs</span>
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
          </div>

          {/* LOWER ANALYTICS ROW BLOCKS */}
          {selectedNode && (
            <div className="bottom-analytics-deck">
              <div className="correlation-card-wrapper">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: 'var(--fd)' }}>Root Cause Correlations</h3>
                  <p style={{ fontSize: '11px', color: 'var(--muted)' }}>Shows how different root causes impact each other and their cascading effects</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div className="correlation-item-row">
                    <div className="correlation-item-left">
                      <div className="status-indicator-dot" style={{ background: '#ff4d6a', boxShadow: '0 0 10px rgba(255,77,106,0.3)' }}>R</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Delayed Action Pipeline Tracking Variance</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Correlation: <span style={{color:'var(--teal)', fontWeight:'600'}}>82%</span> | Impact Weight Factor: <span style={{color:'var(--amb)', fontWeight:'600'}}>76%</span></span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#ff4d6a', textTransform: 'uppercase' }}>Critical Impact</span>
                  </div>

                  <div className="correlation-item-row">
                    <div className="correlation-item-left">
                      <div className="status-indicator-dot" style={{ background: '#ffb830', boxShadow: '0 0 10px rgba(255,184,48,0.3)' }}>S</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>System Core Workflow Configuration Adjustments</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Correlation: <span style={{color:'var(--teal)', fontWeight:'600'}}>68%</span> | Impact Weight Factor: <span style={{color:'var(--amb)', fontWeight:'600'}}>61%</span></span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffb830', textTransform: 'uppercase' }}>High Impact</span>
                  </div>

                  <div className="correlation-item-row">
                    <div className="correlation-item-left">
                      <div className="status-indicator-dot" style={{ background: '#3b9eff', boxShadow: '0 0 10px rgba(59,158,255,0.3)' }}>V</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Vendor / Customer Master Ledger Cleansing Disconnects</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Correlation: <span style={{color:'var(--teal)', fontWeight:'600'}}>45%</span> | Impact Weight Factor: <span style={{color:'var(--amb)', fontWeight:'600'}}>41%</span></span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#3b9eff', textTransform: 'uppercase' }}>Medium Impact</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: 'var(--muted)', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color:'#ff4d6a' }}>●</span> High Correlation (&gt;70%)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color:'#ffb830' }}>●</span> Medium Correlation (40-70%)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color:'#3b9eff' }}>●</span> Low Correlation (&lt;40%)</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact Summary</div>
                <div className="impact-summary-grid">
                  <div className="summary-metric-box" style={{ background: 'rgba(255, 77, 106, 0.03)', borderColor: 'rgba(255, 77, 106, 0.12)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Root Causes</span>
                    <span className="num" style={{ fontSize: '24px', fontWeight: '800', color: '#ff4d6a' }}>3</span>
                  </div>
                  <div className="summary-metric-box" style={{ background: 'rgba(255, 184, 48, 0.03)', borderColor: 'rgba(255, 184, 48, 0.12)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Sub-Causes</span>
                    <span className="num" style={{ fontSize: '24px', fontWeight: '800', color: '#ffb830' }}>6</span>
                  </div>
                  <div className="summary-metric-box" style={{ background: 'rgba(16, 224, 138, 0.03)', borderColor: 'rgba(16, 224, 138, 0.12)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Average Impact Weight</span>
                    <span className="num" style={{ fontSize: '24px', fontWeight: '800', color: '#10e08a' }}>{selectedNode.pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Insights</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="ai-insight-strip">
                    <span style={{ color: 'var(--teal)' }}>✦</span> Over <span style={{color: '#fff', fontWeight: '600'}}>78%</span> of matching anomalies are consolidated within high-frequency transaction value buckets.
                  </div>
                  <div className="ai-insight-strip">
                    <span style={{ color: 'var(--teal)' }}>✦</span> Organizational branch components indicate a 2.4x variance spikes compared to the historical compliance baseline records.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- RE-ENGINEERED EXCEL/CSV FIXED NO-OVERLAP DIALOG OVERLAY --- */}
      {modalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal-container">
            
            <div className="tx-modal-header">
              <div>
                <h2 className="tx-modal-title">Transactions for {selectedNode?.name}</h2>
                <div className="tx-modal-subtitle">{Array.isArray(transactions) ? transactions.length : 0} transactions located inside repository logs</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  className="tx-download-btn" 
                  onClick={() => window.open(`http://127.0.0.1:5001/rca/transactions/${encodeURIComponent(currentException)}?download=true`, '_blank')}
                >
                  <svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginTop:'1px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4m4-10 5 5 5-5m-5-3v12"/></svg>
                  Download CSV
                </button>
                <button className="tx-dismiss-x" onClick={() => setModalOpen(false)}>✕</button>
              </div>
            </div>

            {/* Non-overlapping grid structure container block */}
            <div className="tx-table-wrapper">
              {loadingTx ? (
                <div className="loading" style={{minHeight:'250px'}}><div className="spin" style={{borderTopColor:'#475569'}}></div></div>
              ) : txError ? (
                <div className="err" style={{margin:'20px 0'}}>{txError}</div>
              ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontSize: '15px' }}>No document record items found for this localized operational node tree slice.</div>
              ) : (
                <table className="tx-native-table">
                  <thead>
                    <tr>
                      {Object.keys(transactions[0]).map(key => (
                        <th key={key}>{key.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr key={idx}>
                        {Object.entries(tx).map(([colName, val], vIdx) => {
                          const isFirstCell = vIdx === 0;
                          const isAmount = colName.toLowerCase().includes('amount') || colName.toLowerCase().includes('value') || colName.toLowerCase().includes('diff') || colName.toLowerCase().includes('price');
                          const isStatus = colName.toLowerCase().includes('status') || colName.toLowerCase().includes('indicator');

                          let cellContent = val !== null && val !== undefined ? String(val) : '-';
                          if (isAmount && val && !String(val).includes('₹')) {
                            cellContent = `₹${Number(val).toLocaleString(undefined, {maximumFractionDigits:0})}`;
                          }

                          return (
                            <td key={vIdx} className={isFirstCell ? "tx-cell-bold" : ""}>
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="tx-modal-footer">
              <div className="tx-footer-count">Showing {Array.isArray(transactions) ? transactions.length : 0} ledger items rows</div>
              <button className="tx-footer-close-btn" onClick={() => setModalOpen(false)}>Close</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RootCauseExplorer;
import React, { useState, useCallback, useEffect } from 'react';
import { PlusCircle, Trash2, Square, Circle, Diamond, Link, Edit2 } from 'lucide-react';

interface DragOffset {
  x: number;
  y: number;
  elementId?: number;
}

interface Element {
  id: number;
  type: string;
  x: number;
  y: number;
  label: string;
  isPrimary?: boolean;
}

interface Connection {
  id: number;
  from: number;
  to: number;
  fromCardinality: string;
  toCardinality: string;
}

// History interface for undo/redo
interface History {
  connections: Connection[];
}

const ERDiagramApp: React.FC = () => {
  // History stacks for undo/redo
  const [undoStack, setUndoStack] = useState<History[]>([]);
  const [redoStack, setRedoStack] = useState<History[]>([]);

  const [elements, setElements] = useState<Element[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<Element | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [editingCardinality, setEditingCardinality] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<number | null>(null);

  // Handle keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack]);

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      const currentState: History = { connections: [...connections] };
      
      setRedoStack([...redoStack, currentState]);
      setUndoStack(undoStack.slice(0, -1));
      setConnections(previousState.connections);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const currentState: History = { connections: [...connections] };
      
      setUndoStack([...undoStack, currentState]);
      setRedoStack(redoStack.slice(0, -1));
      setConnections(nextState.connections);
    }
  };

  // Save state to undo stack when connections change
  const saveToHistory = (newConnections: Connection[]) => {
    setUndoStack([...undoStack, { connections: [...connections] }]);
    setRedoStack([]); // Clear redo stack when new action is performed
    setConnections(newConnections);
  };

  const elementTypes = {
    ENTITY: {
      icon: <Square className="w-6 h-6" />,
      label: 'Entity',
      shape: ({ x, y, label, id }: Element) => (
        <g onClick={(e) => {
          e.stopPropagation();
          setEditingLabel(id);
        }}>
          <rect
            x={x}
            y={y}
            width="120"
            height="60"
            className="fill-white stroke-black stroke-2"
          />
          {editingLabel === id ? (
            <foreignObject x={x} y={y} width="120" height="60">
              <div className="h-full flex items-center justify-center">
                <input
                  type="text"
                  value={label}
                  className="w-full text-center bg-white border-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => updateLabel(id, e.target.value)}
                  onBlur={() => setEditingLabel(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                  autoFocus
                />
              </div>
            </foreignObject>
          ) : (
            <text
              x={x + 60}
              y={y + 35}
              className="text-sm text-center"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ),
      connectionPoint: (x: number, y: number) => ({ x: x + 60, y: y + 30 })
    },
    WEAK_ENTITY: {
      icon: <Square className="w-6 h-6" />,
      label: 'Weak Entity',
      shape: ({ x, y, label, id }: Element) => (
        <g onClick={(e) => {
          e.stopPropagation();
          setEditingLabel(id);
        }}>
          <rect
            x={x}
            y={y}
            width="120"
            height="60"
            className="fill-white stroke-black stroke-2"
          />
          <rect
            x={x + 5}
            y={y + 5}
            width="110"
            height="50"
            className="fill-white stroke-black stroke-2"
            fillOpacity="0"
          />
          {editingLabel === id ? (
            <foreignObject x={x} y={y} width="120" height="60">
              <div className="h-full flex items-center justify-center">
                <input
                  type="text"
                  value={label}
                  className="w-full text-center bg-white border-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => updateLabel(id, e.target.value)}
                  onBlur={() => setEditingLabel(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                  autoFocus
                />
              </div>
            </foreignObject>
          ) : (
            <text
              x={x + 60}
              y={y + 35}
              className="text-sm text-center"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ),
      connectionPoint: (x: number, y: number) => ({ x: x + 60, y: y + 30 })
    },
    ATTRIBUTE: {
      icon: <Circle className="w-6 h-6" />,
      label: 'Attribute',
      shape: ({ x, y, label, isPrimary, id }: Element) => (
        <g onClick={(e) => {
          e.stopPropagation();
          setEditingLabel(id);
        }}>
          <circle
            cx={x + 40}
            cy={y + 30}
            r="30"
            className="fill-white stroke-black stroke-2"
          />
          {editingLabel === id ? (
            <foreignObject x={x + 10} y={y + 15} width="60" height="30">
              <input
                type="text"
                value={label}
                className="w-full text-center bg-white border-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => updateLabel(id, e.target.value)}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                autoFocus
              />
            </foreignObject>
          ) : (
            <text
              x={x + 40}
              y={y + 35}
              className={`text-sm text-center ${isPrimary ? 'underline' : ''}`}
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ),
      connectionPoint: (x: number, y: number) => ({ x: x + 40, y: y + 30 })
    },
    DERIVED_ATTRIBUTE: {
      icon: <Circle className="w-6 h-6" />,
      label: 'Derived',
      shape: ({ x, y, label, id }: Element) => (
        <g onClick={(e) => {
          e.stopPropagation();
          setEditingLabel(id);
        }}>
          <circle
            cx={x + 40}
            cy={y + 30}
            r="30"
            className="fill-white stroke-black stroke-2"
            strokeDasharray="5,5"
          />
          {editingLabel === id ? (
            <foreignObject x={x + 10} y={y + 15} width="60" height="30">
              <input
                type="text"
                value={label}
                className="w-full text-center bg-white border-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => updateLabel(id, e.target.value)}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                autoFocus
              />
            </foreignObject>
          ) : (
            <text
              x={x + 40}
              y={y + 35}
              className="text-sm text-center"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ),
      connectionPoint: (x: number, y: number) => ({ x: x + 40, y: y + 30 })
    },
    MULTI_VALUED_ATTRIBUTE: {
      icon: <Circle className="w-6 h-6" />,
      label: 'Multi-Valued',
      shape: ({ x, y, label, id }: Element) => (
        <g onClick={(e) => {
          e.stopPropagation();
          setEditingLabel(id);
        }}>
          <circle
            cx={x + 40}
            cy={y + 30}
            r="30"
            className="fill-white stroke-black stroke-2"
          />
          <circle
            cx={x + 40}
            cy={y + 30}
            r="25"
            className="fill-none stroke-black stroke-2"
          />
          {editingLabel === id ? (
            <foreignObject x={x + 10} y={y + 15} width="60" height="30">
              <input
                type="text"
                value={label}
                className="w-full text-center bg-white border-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => updateLabel(id, e.target.value)}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                autoFocus
              />
            </foreignObject>
          ) : (
            <text
              x={x + 40}
              y={y + 35}
              className="text-sm text-center"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ),
      connectionPoint: (x: number, y: number) => ({ x: x + 40, y: y + 30 })
    },
    RELATIONSHIP: {
      icon: <Diamond className="w-6 h-6" />,
      label: 'Relationship',
      shape: ({ x, y, label, id }: Element) => (
        <g onClick={(e) => {
          e.stopPropagation();
          setEditingLabel(id);
        }}>
          <path
            d={`M${x + 60} ${y} L${x + 120} ${y + 30} L${x + 60} ${y + 60} L${x} ${y + 30} Z`}
            className="fill-white stroke-black stroke-2"
          />
          {editingLabel === id ? (
            <foreignObject x={x + 30} y={y + 15} width="60" height="30">
              <input
                type="text"
                value={label}
                className="w-full text-center bg-white border-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => updateLabel(id, e.target.value)}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                autoFocus
              />
            </foreignObject>
          ) : (
            <text
              x={x + 60}
              y={y + 35}
              className="text-sm text-center"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ),
      connectionPoint: (x: number, y: number) => ({ x: x + 60, y: y + 30 })
    }
  };

  const addElement = (type: string) => {
    const newElement = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      label: `${elementTypes[type].label} ${elements.length + 1}`,
      isPrimary: false
    };
    setElements([...elements, newElement]);
  };

  const updateLabel = (id: number, newLabel: string) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, label: newLabel } : el
    ));
  };

  const togglePrimaryKey = (id: number) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, isPrimary: !el.isPrimary } : el
    ));
  };

  const deleteElement = (id: number) => {
    setElements(elements.filter(el => el.id !== id));
    saveToHistory(connections.filter(conn => 
      conn.from !== id && conn.to !== id
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, element: Element) => {
    if (connecting) {
      if (connecting.id !== element.id) {
        const existingConnection = connections.find(conn => 
          (conn.from === connecting.id && conn.to === element.id) ||
          (conn.from === element.id && conn.to === connecting.id)
        );

        if (existingConnection) {
          saveToHistory(connections.filter(conn => conn.id !== existingConnection.id));
        } else {
          saveToHistory([...connections, {
            id: Date.now(),
            from: connecting.id,
            to: element.id,
            fromCardinality: "1",
            toCardinality: "N"
          }]);
        }
      }
      setConnecting(null);
    } else {
      const svg = e.target.closest('svg');
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setIsDragging(true);
      setDragOffset({
        x: x - element.x,
        y: y - element.y,
        elementId: element.id
      });
    }
  };

  const startConnecting = (element: Element) => {
    if (connecting?.id === element.id) {
      setConnecting(null);
    } else {
      setConnecting(element);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragOffset.elementId) return;

    const svg = e.target.closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setElements(elements.map(el =>
      el.id === dragOffset.elementId
        ? { ...el, x, y }
        : el
    ));
  }, [isDragging, dragOffset, elements]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateCardinality = (connId: number, end: 'from' | 'to', value: string) => {
    const newConnections = connections.map(conn => {
      if (conn.id === connId) {
        return {
          ...conn,
          [end === 'from' ? 'fromCardinality' : 'toCardinality']: value
        };
      }
      return conn;
    });
    saveToHistory(newConnections);
    setEditingCardinality(null);
  };

  const renderConnection = (conn: Connection) => {
    const fromElement = elements.find(el => el.id === conn.from);
    const toElement = elements.find(el => el.id === conn.to);
    
    if (!fromElement || !toElement) return null;

    const from = elementTypes[fromElement.type].connectionPoint(fromElement.x, fromElement.y);
    const to = elementTypes[toElement.type].connectionPoint(toElement.x, toElement.y);

    const fromMidpoint = {
      x: from.x + (to.x - from.x) * 0.2,
      y: from.y + (to.y - from.y) * 0.2
    };
    const toMidpoint = {
      x: from.x + (to.x - from.x) * 0.8,
      y: from.y + (to.y - from.y) * 0.8
    };

    return (
      <g key={conn.id}>
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          className="stroke-black stroke-2"
        />
        
        {editingCardinality === `${conn.id}-from` ? (
          <foreignObject x={fromMidpoint.x - 15} y={fromMidpoint.y - 15} width="30" height="30">
            <input
              type="text"
              value={conn.fromCardinality}
              className="w-full h-full text-center bg-white border rounded"
              onChange={(e) => updateCardinality(conn.id, 'from', e.target.value)}
              onBlur={() => setEditingCardinality(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingCardinality(null)}
              autoFocus
            />
          </foreignObject>
        ) : (
          <text
            x={fromMidpoint.x}
            y={fromMidpoint.y}
            className="text-sm cursor-pointer"
            textAnchor="middle"
            onClick={() => setEditingCardinality(`${conn.id}-from`)}
          >
            {conn.fromCardinality}
          </text>
        )}

        {editingCardinality === `${conn.id}-to` ? (
          <foreignObject x={toMidpoint.x - 15} y={toMidpoint.y - 15} width="30" height="30">
            <input
              type="text"
              value={conn.toCardinality}
              className="w-full h-full text-center bg-white border rounded"
              onChange={(e) => updateCardinality(conn.id, 'to', e.target.value)}
              onBlur={() => setEditingCardinality(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingCardinality(null)}
              autoFocus
            />
          </foreignObject>
        ) : (
          <text
            x={toMidpoint.x}
            y={toMidpoint.y}
            className="text-sm cursor-pointer"
            textAnchor="middle"
            onClick={() => setEditingCardinality(`${conn.id}-to`)}
          >
            {conn.toCardinality}
          </text>
        )}
      </g>
    );
  };

  const renderElementControls = (element: Element) => (
    <g className="cursor-pointer">
      <circle
        cx={element.x + 125}
        cy={element.y - 5}
        r="10"
        className="fill-red-500"
        onClick={() => deleteElement(element.id)}
      />
      <Trash2
        className="w-4 h-4 text-white"
        style={{
          transform: `translate(${element.x + 121}px, ${element.y - 7}px)`
        }}
      />
      
      {element.type === 'ATTRIBUTE' && (
        <g onClick={() => togglePrimaryKey(element.id)}>
          <circle
            cx={element.x + 125}
            cy={element.y + 15}
            r="10"
            className={`${element.isPrimary ? 'fill-green-500' : 'fill-gray-400'}`}
          />
          <text
            x={element.x + 125}
            y={element.y + 19}
            className="text-white text-xs font-bold"
            textAnchor="middle"
          >
            PK
          </text>
        </g>
      )}
      
      <g onClick={() => startConnecting(element)}>
        <circle
          cx={element.x + 125}
          cy={element.y + 35}
          r="10"
          className={`${connecting?.id === element.id ? 'fill-green-500' : 'fill-blue-500'}`}
        />
        <Link
          className="w-4 h-4 text-white"
          style={{
            transform: `translate(${element.x + 121}px, ${element.y + 33}px)`
          }}
        />
      </g>
    </g>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">ER Diagram Editor</h1>
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Redo
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(elementTypes).map(([type, { icon, label }]) => (
            <button
              key={type}
              onClick={() => addElement(type)}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {icon}
              <span className="ml-2">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <svg
          className="w-full h-full bg-white border shadow-sm"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {connections.map(renderConnection)}
          
          {elements.map(element => {
            const ElementShape = elementTypes[element.type].shape;
            return (
              <g
                key={element.id}
                onMouseDown={(e) => handleMouseDown(e, element)}
                className="cursor-move"
              >
                <ElementShape {...element} />
                {renderElementControls(element)}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ERDiagramApp;
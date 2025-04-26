import React, { useState, useEffect } from 'react';
import './LeftPanel.css';
import ViewCube from './ViewCube';

function LeftPanel() {
  const [activeView, setActiveView] = useState('perspective'); // 默认视角为透视模式
  const [isClippingPlaneActive, setIsClippingPlaneActive] = useState(false);
  const [isPlaneSelected, setIsPlaneSelected] = useState(false);
  const [activeOperation, setActiveOperation] = useState('translate'); // 默认操作为移动
  const [isObjectSelected, setIsObjectSelected] = useState(false);
  const [isRoomLabelsVisible, setIsRoomLabelsVisible] = useState(false); // 用于控制room标签的显示状态
  const [isOutlineVisible, setIsOutlineVisible] = useState(true); // 用于控制对象轮廓的显示状态，默认显示
  const [isGridMeshVisible, setIsGridMeshVisible] = useState(true); // 网格默认可见

  // 处理Isometric视角按钮点击
  const handleIsometricClick = () => {
    setActiveView('isometric');
    // 发送事件通知BuildingModel组件切换到等距视图
    window.dispatchEvent(new CustomEvent('changeViewMode', { 
      detail: { mode: 'isometric' } 
    }));
  };

  // 处理Perspective视角按钮点击
  const handlePerspectiveClick = () => {
    setActiveView('perspective');
    // 发送事件通知BuildingModel组件切换到透视视图
    window.dispatchEvent(new CustomEvent('changeViewMode', { 
      detail: { mode: 'perspective' } 
    }));
  };

  // 处理Room按钮点击
  const handleRoomClick = () => {
    const newState = !isRoomLabelsVisible;
    setIsRoomLabelsVisible(newState);
    // 发送事件通知BuildingModel组件显示或隐藏room标签
    window.dispatchEvent(new CustomEvent('toggleRoomLabels', { 
      detail: { visible: newState } 
    }));
  };

  // 处理Outline按钮点击
  const handleOutlineClick = () => {
    const newState = !isOutlineVisible;
    setIsOutlineVisible(newState);
    // 发送事件通知BuildingModel组件显示或隐藏对象轮廓
    window.dispatchEvent(new CustomEvent('toggleOutlines', { 
      detail: { visible: newState } 
    }));
  };

  // 处理裁剪平面按钮点击
  const handleClipPlaneClick = () => {
    setIsClippingPlaneActive(!isClippingPlaneActive);
    if (!isClippingPlaneActive) {
      // 通知 BuildingModel 组件创建裁切平面
      window.dispatchEvent(new CustomEvent('createClippingPlane'));
    } else {
      // 通知 BuildingModel 组件移除裁切平面
      window.dispatchEvent(new CustomEvent('removeClippingPlane'));
    }
  };

  // 处理裁剪平面操作按钮点击
  const handleClipPlaneOperationClick = (operation) => {
    if (isClippingPlaneActive) {
      // 通知 BuildingModel 组件切换操作模式
      window.dispatchEvent(new CustomEvent('changeClippingPlaneOperation', { 
        detail: { operation } 
      }));
    }
  };

  // 处理对象变换操作按钮点击
  const handleObjectOperationClick = (operation) => {
    setActiveOperation(operation);
    // 通知 ObjectTransformer 组件切换操作模式
    window.dispatchEvent(new CustomEvent('changeObjectOperation', { 
      detail: { operation } 
    }));
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (isPlaneSelected) {
        setIsPlaneSelected(false);
        // 通知 BuildingModel 组件取消选择裁切平面
        window.dispatchEvent(new CustomEvent('deselectClippingPlane'));
      } else if (isClippingPlaneActive) {
        setIsClippingPlaneActive(false);
        // 通知 BuildingModel 组件移除裁切平面
        window.dispatchEvent(new CustomEvent('removeClippingPlane'));
      }
    }
  };

  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClippingPlaneActive, isPlaneSelected]);

  // 监听裁切平面选择状态变化
  useEffect(() => {
    const handlePlaneSelected = (e) => {
      setIsPlaneSelected(e.detail.selected);
    };

    window.addEventListener('clippingPlaneSelected', handlePlaneSelected);
    return () => {
      window.removeEventListener('clippingPlaneSelected', handlePlaneSelected);
    };
  }, []);

  // 监听对象选择状态变化
  useEffect(() => {
    const handleObjectSelected = (e) => {
      setIsObjectSelected(e.detail.selected);
    };

    window.addEventListener('objectSelected', handleObjectSelected);
    return () => {
      window.removeEventListener('objectSelected', handleObjectSelected);
    };
  }, []);

  // 处理网格按钮点击
  const handleMeshClick = () => {
    const newState = !isGridMeshVisible;
    setIsGridMeshVisible(newState);
    // 发送事件通知BuildingModel组件显示或隐藏地面网格
    window.dispatchEvent(new CustomEvent('toggleGridMesh', { 
      detail: { visible: newState } 
    }));
  };

  return (
    <div className="left-panel">
      {/* 第一个区域：视角切换 */}
      <div className="panel-section">
        <h3 className="section-title">View</h3>
        <ViewCube />
        <div className="button-group">
          <button 
            className={`panel-button ${activeView === 'isometric' ? 'active' : ''}`} 
            onClick={handleIsometricClick}
          >
            Isometric
          </button>
          <button 
            className={`panel-button ${activeView === 'perspective' ? 'active' : ''}`} 
            onClick={handlePerspectiveClick}
          >
            Perspective
          </button>
        </div>
      </div>

      {/* 第二个区域：裁剪平面 */}
      <div className="panel-section">
        <h3 className="section-title">Interior</h3>
        <div className="button-group">
          <button 
            className={`panel-button ${isRoomLabelsVisible ? 'active' : ''}`}
            onClick={handleRoomClick}
          >
            Room
          </button>
          <button 
            className={`panel-button ${isOutlineVisible ? 'active' : ''}`}
            onClick={handleOutlineClick}
          >
            Outline
          </button>
          <button 
            className={`panel-button ${isGridMeshVisible ? 'active' : ''}`}
            onClick={handleMeshClick}
          >
            Mesh
          </button>
          <button 
            className={`panel-button ${isClippingPlaneActive ? 'active' : ''}`}
            onClick={handleClipPlaneClick}
          >
            Clip Plane
          </button>
          {isClippingPlaneActive && (
            <div className="operation-buttons-container">
              <button 
                className="panel-button operation-button" 
                onClick={() => handleClipPlaneOperationClick('translate')}
              >
                Move
              </button>
              <button 
                className="panel-button operation-button" 
                onClick={() => handleClipPlaneOperationClick('rotate')}
              >
                Rotate
              </button>
              <button 
                className="panel-button operation-button" 
                onClick={() => handleClipPlaneOperationClick('scale')}
              >
                Scale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 移动到这里：第三个区域：变换操作 */}
      <div className="panel-section">
        <h3 className="section-title">Transform</h3>
        <div className="button-group">
          <button 
            className={`panel-button ${activeOperation === 'translate' && isObjectSelected ? 'active' : ''}`}
            onClick={() => handleObjectOperationClick('translate')}
            disabled={!isObjectSelected}
          >
            Move
          </button>
          <button 
            className={`panel-button ${activeOperation === 'rotate' && isObjectSelected ? 'active' : ''}`}
            onClick={() => handleObjectOperationClick('rotate')}
            disabled={!isObjectSelected}
          >
            Rotate
          </button>
          <button 
            className={`panel-button ${activeOperation === 'scale' && isObjectSelected ? 'active' : ''}`}
            onClick={() => handleObjectOperationClick('scale')}
            disabled={!isObjectSelected}
          >
            Scale
          </button>
        </div>
      </div>

      {/* 第四个区域：模型添加 */}
      <div className="panel-section">
        <h3 className="section-title">Model</h3>
        <div className="button-group">
          <button className="panel-button">Human</button>
          <button className="panel-button">Tree</button>
          <button className="panel-button">Car</button>
          <button className="panel-button">Sofa</button>
          <button className="panel-button">Table</button>
          <button className="panel-button">Chair</button>
          <button className="panel-button">Bed</button>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel; 
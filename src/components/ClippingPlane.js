import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// 这个组件不会直接渲染任何内容，它只是处理裁切平面的逻辑
// 并通过自定义事件与 BuildingModel 组件通信
function ClippingPlane() {
  const planeRef = useRef(null);
  const transformControlsRef = useRef(null);
  const planeHelperRef = useRef(null);
  const operationRef = useRef('translate');
  const isActiveRef = useRef(false);
  const isSelectedRef = useRef(false);

  // 初始化裁切平面
  useEffect(() => {
    // 监听创建裁切平面事件
    const handleCreateClippingPlane = () => {
      // 确保相机已经初始化
      if (!window.camera || !getActiveCamera()) {
        console.error('Camera not initialized yet');
        return;
      }
      
      if (isActiveRef.current) return;
      
      // 创建裁切平面
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -2);
      planeRef.current = plane;
      
      // 创建平面辅助对象
      const planeHelper = new THREE.PlaneHelper(plane, 10, 0xff0000);
      planeHelperRef.current = planeHelper;
      
      // 设置平面位置
      planeHelper.position.set(10, 2, 10);
      plane.normal.set(0, -1, 0);
      plane.constant = -2;
      
      // 创建变换控制器
      const transformControls = new TransformControls(
        getActiveCamera(), 
        window.renderer.domElement
      );
      transformControlsRef.current = transformControls;
      transformControls.attach(planeHelper);
      transformControls.updateMatrixWorld(true);
      transformControls.setMode('translate');
      transformControls.addEventListener('dragging-changed', handleDraggingChanged);
      transformControls.addEventListener('objectChange', handleObjectChange);
      
      // 将平面辅助对象和变换控制器添加到场景
      window.scene.add(planeHelper);
      window.scene.add(transformControls);
      
      // 更新所有材质的裁切平面
      updateMaterialsClippingPlane(plane);
      
      isActiveRef.current = true;
      
      // 通知 BuildingModel 组件裁切平面已创建
      window.dispatchEvent(new CustomEvent('clippingPlaneCreated'));
    };
    
    // 监听移除裁切平面事件
    const handleRemoveClippingPlane = () => {
      if (!isActiveRef.current) return;
      
      // 移除平面辅助对象和变换控制器
      if (planeHelperRef.current && window.scene) {
        window.scene.remove(planeHelperRef.current);
      }
      
      if (transformControlsRef.current && window.scene) {
        window.scene.remove(transformControlsRef.current);
      }
      
      // 清除所有材质的裁切平面
      clearMaterialsClippingPlane();
      
      isActiveRef.current = false;
      isSelectedRef.current = false;
      
      // 通知 BuildingModel 组件裁切平面已移除
      window.dispatchEvent(new CustomEvent('clippingPlaneRemoved'));
    };
    
    // 监听切换操作模式事件
    const handleChangeOperation = (event) => {
      if (!isActiveRef.current) return;
      
      const operation = event.detail.operation;
      operationRef.current = operation;
      
      if (transformControlsRef.current) {
        transformControlsRef.current.setMode(operation);
      }
    };
    
    // 监听取消选择裁切平面事件
    const handleDeselectPlane = () => {
      if (!isActiveRef.current) return;
      
      isSelectedRef.current = false;
      
      // 通知 BuildingModel 组件裁切平面已取消选择
      window.dispatchEvent(new CustomEvent('clippingPlaneSelected', { 
        detail: { selected: false } 
      }));
    };
    
    // 处理拖动状态变化
    const handleDraggingChanged = (event) => {
      if (window.orbitControls) {
        window.orbitControls.enabled = !event.value;
      }
    };
    
    // 处理对象变化
    const handleObjectChange = () => {
      if (!planeHelperRef.current || !planeRef.current) return;
      
      // 更新平面位置和方向
      const position = planeHelperRef.current.position;
      const quaternion = planeHelperRef.current.quaternion;
      
      // 从四元数中提取法线方向
      const normal = new THREE.Vector3(0, 1, 0);
      normal.applyQuaternion(quaternion);
      
      // 更新平面
      planeRef.current.normal.copy(normal);
      planeRef.current.constant = -normal.dot(position);
      
      // 更新所有材质的裁切平面
      updateMaterialsClippingPlane(planeRef.current);
    };
    
    // 添加事件监听
    window.addEventListener('createClippingPlane', handleCreateClippingPlane);
    window.addEventListener('removeClippingPlane', handleRemoveClippingPlane);
    window.addEventListener('changeClippingPlaneOperation', handleChangeOperation);
    window.addEventListener('deselectClippingPlane', handleDeselectPlane);
    
    // 添加点击事件监听，用于选择裁切平面
    const handleClick = (event) => {
      if (!isActiveRef.current) return;
      
      // 检查是否点击了裁切平面
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      // 计算鼠标位置
      const rect = window.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // 设置射线
      raycaster.setFromCamera(mouse, getActiveCamera());
      
      // 检查射线与平面辅助对象的交点
      const intersects = raycaster.intersectObject(planeHelperRef.current);
      
      if (intersects.length > 0) {
        isSelectedRef.current = true;
        
        // 通知 BuildingModel 组件裁切平面已选择
        window.dispatchEvent(new CustomEvent('clippingPlaneSelected', { 
          detail: { selected: true } 
        }));
      }
    };
    
    window.addEventListener('click', handleClick);
    
    // 清理函数
    return () => {
      window.removeEventListener('createClippingPlane', handleCreateClippingPlane);
      window.removeEventListener('removeClippingPlane', handleRemoveClippingPlane);
      window.removeEventListener('changeClippingPlaneOperation', handleChangeOperation);
      window.removeEventListener('deselectClippingPlane', handleDeselectPlane);
      window.removeEventListener('click', handleClick);
      
      // 移除裁切平面
      if (isActiveRef.current) {
        handleRemoveClippingPlane();
      }
    };
  }, []);
  
  // 更新所有材质的裁切平面
  const updateMaterialsClippingPlane = (plane) => {
    if (!window.scene) return;
    
    window.scene.traverse((object) => {
      if (object.isMesh) {
        // 确保材质支持裁切
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material) {
              material.clippingPlanes = [plane];
              material.needsUpdate = true;
            }
          });
        } else if (object.material) {
          object.material.clippingPlanes = [plane];
          object.material.needsUpdate = true;
        }
      }
    });
  };
  
  // 清除所有材质的裁切平面
  const clearMaterialsClippingPlane = () => {
    if (!window.scene) return;
    
    window.scene.traverse((object) => {
      if (object.isMesh) {
        // 清除材质的裁切平面
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material) {
              material.clippingPlanes = [];
              material.needsUpdate = true;
            }
          });
        } else if (object.material) {
          object.material.clippingPlanes = [];
          object.material.needsUpdate = true;
        }
      }
    });
  };
  
  // 更新任何使用window.camera的地方，确保使用active相机
  const getActiveCamera = () => {
    return window.camera ? window.camera.active : null;
  };
  
  // 这个组件不渲染任何内容
  return null;
}

export default ClippingPlane; 
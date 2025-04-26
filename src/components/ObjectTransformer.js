import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// 这个组件不会直接渲染任何内容，它只是处理对象选择和变换的逻辑
function ObjectTransformer() {
  const transformControlsRef = useRef(null);
  const selectedObjectRef = useRef(null);
  const operationRef = useRef('translate'); // 默认操作为移动
  const isActiveRef = useRef(false);
  
  // 为撤销/重做功能添加历史记录
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isTransformingRef = useRef(false);
  const objectStartStateRef = useRef(null);

  // 获取当前激活的相机
  const getActiveCamera = () => {
    return window.camera ? window.camera.active : null;
  };

  // 记录对象状态的函数
  const saveObjectState = (object) => {
    if (!object) return null;
    
    return {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone()
    };
  };

  // 恢复对象状态的函数
  const restoreObjectState = (object, state) => {
    if (!object || !state) return;
    
    object.position.copy(state.position);
    object.rotation.copy(state.rotation);
    object.scale.copy(state.scale);
  };

  // 添加到历史记录的函数
  const addToHistory = (oldState, newState) => {
    // 如果我们在历史中间执行了一个新操作，需要删除之后的历史
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    historyRef.current.push({
      oldState: oldState,
      newState: newState,
      objectId: selectedObjectRef.current ? selectedObjectRef.current.id : null
    });
    historyIndexRef.current = historyRef.current.length - 1;
    
    console.log(`Added action to history. History length: ${historyRef.current.length}, Current index: ${historyIndexRef.current}`);
  };

  // 撤销上一步操作
  const undo = () => {
    if (historyIndexRef.current < 0 || !historyRef.current.length) {
      console.log('Nothing to undo');
      return;
    }
    
    const action = historyRef.current[historyIndexRef.current];
    const object = findObjectById(action.objectId);
    
    if (object) {
      restoreObjectState(object, action.oldState);
      console.log('Undoing action:', historyIndexRef.current);
    } else {
      console.warn('Object not found for undo operation');
    }
    
    historyIndexRef.current--;
  };

  // 重做上一步操作
  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      console.log('Nothing to redo');
      return;
    }
    
    historyIndexRef.current++;
    const action = historyRef.current[historyIndexRef.current];
    const object = findObjectById(action.objectId);
    
    if (object) {
      restoreObjectState(object, action.newState);
      console.log('Redoing action:', historyIndexRef.current);
    } else {
      console.warn('Object not found for redo operation');
    }
  };

  // 通过ID查找对象
  const findObjectById = (id) => {
    let foundObject = null;
    
    if (!window.scene || !id) return null;
    
    window.scene.traverse((object) => {
      if (object.id === id) {
        foundObject = object;
      }
    });
    
    return foundObject;
  };

  // 初始化对象选择和变换控制
  useEffect(() => {
    // 变换控制器的处理函数
    const handleOperationModeChange = (event) => {
      if (!isActiveRef.current || !transformControlsRef.current) return;
      
      const operation = event.detail.operation;
      operationRef.current = operation;
      
      if (transformControlsRef.current) {
        transformControlsRef.current.setMode(operation);
      }
    };

    // 处理拖动状态变化
    const handleDraggingChanged = (event) => {
      if (window.orbitControls) {
        window.orbitControls.enabled = !event.value;
      }
      
      // 当拖动开始时保存初始状态
      if (event.value && selectedObjectRef.current) {
        isTransformingRef.current = true;
        objectStartStateRef.current = saveObjectState(selectedObjectRef.current);
      } 
      // 当拖动结束时记录历史
      else if (!event.value && isTransformingRef.current && selectedObjectRef.current) {
        isTransformingRef.current = false;
        const objectEndState = saveObjectState(selectedObjectRef.current);
        
        // 只有在状态实际发生变化时才记录历史
        if (objectStartStateRef.current && 
            (objectStartStateRef.current.position.distanceTo(objectEndState.position) > 0.001 ||
             objectStartStateRef.current.rotation.equals(objectEndState.rotation) === false ||
             objectStartStateRef.current.scale.distanceTo(objectEndState.scale) > 0.001)) {
          
          addToHistory(objectStartStateRef.current, objectEndState);
        }
        
        objectStartStateRef.current = null;
      }
    };

    // 创建变换控制器
    const createTransformControls = () => {
      try {
        if (!window.scene || !getActiveCamera() || !window.renderer) {
          console.error('Scene, camera or renderer not initialized');
          return;
        }

        // 如果已经存在，则先移除
        if (transformControlsRef.current && window.scene) {
          // 确保先分离任何附加的对象
          transformControlsRef.current.detach();
          
          // 移除事件监听
          if (transformControlsRef.current._listeners && 
              transformControlsRef.current._listeners['dragging-changed']) {
            transformControlsRef.current.removeEventListener('dragging-changed', handleDraggingChanged);
          }
          
          window.scene.remove(transformControlsRef.current);
          transformControlsRef.current = null;
        }

        // 创建变换控制器
        const transformControls = new TransformControls(
          getActiveCamera(), 
          window.renderer.domElement
        );
        
        // 确保相机已正确设置
        if (!transformControls.camera) {
          console.error('Failed to set camera for transform controls');
          return;
        }
        
        transformControlsRef.current = transformControls;
        
        // 设置操作模式
        transformControls.setMode(operationRef.current);
        
        // 添加事件监听
        transformControls.addEventListener('dragging-changed', handleDraggingChanged);
        
        // 添加到场景
        window.scene.add(transformControls);
        
        isActiveRef.current = true;
        
        // 强制更新以确保控制器正确初始化
        transformControls.updateMatrixWorld();
      } catch (error) {
        console.error('Error creating transform controls:', error);
        isActiveRef.current = false;
      }
    };

    // 安全地附加对象到变换控制器
    const attachObject = (object) => {
      try {
        if (!transformControlsRef.current || !object) {
          console.warn('Cannot attach: transform controls or object is null');
          return false;
        }
        
        // 确保对象是有效的THREE.Object3D并且在场景中
        if (!(object instanceof THREE.Object3D) || !object.parent) {
          console.warn('Cannot attach: object is not valid or not in scene');
          return false;
        }
        
        // 先分离当前对象（如果有）
        transformControlsRef.current.detach();
        
        // 确保对象的世界矩阵是最新的
        object.updateMatrixWorld(true);
        
        // 附加对象并更新控制器
        transformControlsRef.current.attach(object);
        // 正确更新变换控制器的矩阵
        transformControlsRef.current.updateMatrixWorld();
        
        return true;
      } catch (error) {
        console.error('Error attaching object to transform controls:', error);
        return false;
      }
    };
    
    // 安全地分离对象
    const detachObject = () => {
      try {
        if (!transformControlsRef.current) return;
        
        // 保存当前选择的对象的引用（如果有）
        const objectToDetach = selectedObjectRef.current;
        
        // 首先将选择引用设置为null以避免后续操作引用到已分离的对象
        selectedObjectRef.current = null;
        
        // 分离控制器
        transformControlsRef.current.detach();
        
        // 通知其他组件对象已被取消选择
        window.dispatchEvent(new CustomEvent('objectSelected', { 
          detail: { object: null, selected: false, info: null } 
        }));
        
        return objectToDetach;
      } catch (error) {
        console.error('Error detaching object from transform controls:', error);
        selectedObjectRef.current = null;
        return null;
      }
    };

    // 处理对象点击选择
    const handleObjectClick = (event) => {
      try {
        if (!window.scene || !getActiveCamera() || !window.renderer) return;
        
        // 创建射线
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // 计算鼠标位置
        const rect = window.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 设置射线
        raycaster.setFromCamera(mouse, getActiveCamera());
        
        // 查找场景中可以点击的对象 - 只选择可选择的对象
        const clickableObjects = [];
        window.scene.traverse((object) => {
          if (object.isMesh && 
              !(object instanceof THREE.GridHelper) && 
              !(object instanceof THREE.PlaneHelper) &&
              !(object instanceof THREE.AxesHelper) &&
              !(object instanceof THREE.LineSegments) && // 排除轮廓线对象
              object.userData && 
              object.userData.selectable === true) {
            clickableObjects.push(object);
          }
        });
        
        // 检查与可点击对象的交点
        const intersects = raycaster.intersectObjects(clickableObjects, false); // false表示不检查子对象
        
        if (intersects.length > 0) {
          // 选中第一个相交的对象
          const object = intersects[0].object;
          
          // 检查对象是否是轮廓线
          if (object instanceof THREE.LineSegments) {
            console.warn('Selected object is a wireframe outline, ignoring');
            return;
          }
          
          // 检查对象是否有效且仍在场景中
          if (!object || !object.parent) {
            console.warn('Selected object is not valid or not in scene');
            return;
          }
          
          // 确保我们选择的是主对象而不是其子对象
          const targetObject = object.userData.isOutline ? object.parent : object;
          
          // 如果变换控制器不存在，则创建
          if (!transformControlsRef.current) {
            createTransformControls();
          }
          
          // 使用安全附加函数
          if (attachObject(targetObject)) {
            selectedObjectRef.current = targetObject;
            
            // 显示对象信息
            console.log('Selected object:', targetObject.userData);
            
            // 通知组件对象已被选中
            window.dispatchEvent(new CustomEvent('objectSelected', { 
              detail: { 
                object: targetObject, 
                selected: true,
                info: {
                  type: targetObject.userData.type || 'unknown',
                  name: targetObject.userData.name || 'Unnamed object',
                  position: targetObject.position.toArray().map(val => Math.round(val * 100) / 100)
                }
              } 
            }));
          }
        } else {
          // 如果点击在空白处，取消选择对象
          detachObject();
        }
      } catch (error) {
        console.error('Error handling object click:', error);
      }
    };

    // 取消选择对象
    const handleDeselectObject = () => {
      if (transformControlsRef.current && selectedObjectRef.current) {
        transformControlsRef.current.detach();
        selectedObjectRef.current = null;
        
        // 通知组件对象已被取消选择
        window.dispatchEvent(new CustomEvent('objectSelected', { 
          detail: { object: null, selected: false } 
        }));
      }
    };

    // 处理键盘事件
    const handleKeyDown = (event) => {
      // Ctrl+Z 和 Ctrl+Y 用于撤销和重做
      if (event.ctrlKey) {
        if (event.key === 'z') {
          undo();
          event.preventDefault();
        } else if (event.key === 'y') {
          redo();
          event.preventDefault();
        }
      }
      
      // ESC 键用于取消选择
      if (event.key === 'Escape') {
        handleDeselectObject();
        event.preventDefault();
      }
      
      // Delete 或 Backspace 键用于删除对象
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedObjectRef.current && window.scene) {
          try {
            // 获取要删除的对象
            const objectToRemove = selectedObjectRef.current;
            
            // 先保存引用并清空选中对象，以避免后续操作引用已删除的对象
            selectedObjectRef.current = null;
            
            // 安全地分离控制器
            if (transformControlsRef.current) {
              transformControlsRef.current.detach();
              
              // 确保在下一帧更新控制器
              requestAnimationFrame(() => {
                if (transformControlsRef.current) {
                  transformControlsRef.current.updateMatrixWorld();
                }
              });
            }
            
            // 从场景中移除对象
            if (window.scene && objectToRemove.parent === window.scene) {
              window.scene.remove(objectToRemove);
              
              // 释放几何体和材质资源
              if (objectToRemove.geometry) {
                objectToRemove.geometry.dispose();
              }
              
              if (objectToRemove.material) {
                if (Array.isArray(objectToRemove.material)) {
                  objectToRemove.material.forEach(material => material.dispose());
                } else {
                  objectToRemove.material.dispose();
                }
              }
              
              // 确保清除子对象
              while (objectToRemove.children.length > 0) {
                const child = objectToRemove.children[0];
                objectToRemove.remove(child);
              }
              
              // 通知组件对象已被取消选择
              window.dispatchEvent(new CustomEvent('objectSelected', { 
                detail: { selected: false, info: null } 
              }));
              
              console.log('Object deleted');
            } else {
              console.warn('Object could not be removed: not found in scene');
            }
          } catch (error) {
            console.error('Error deleting object:', error);
          }
          
          event.preventDefault();
        }
      }
      
      // 快捷键切换操作模式
      if (selectedObjectRef.current && transformControlsRef.current) {
        switch(event.key) {
          case 'g': // 移动
            transformControlsRef.current.setMode('translate');
            operationRef.current = 'translate';
            break;
          case 'r': // 旋转
            transformControlsRef.current.setMode('rotate');
            operationRef.current = 'rotate';
            break;
          case 's': // 缩放
            transformControlsRef.current.setMode('scale');
            operationRef.current = 'scale';
            break;
          default:
            break;
        }
      }
    };

    // 添加事件监听
    window.addEventListener('click', handleObjectClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('changeObjectOperation', handleOperationModeChange);
    
    // 每当相机视角模式改变时，更新变换控制器的相机引用
    const handleViewModeChange = () => {
      if (transformControlsRef.current && getActiveCamera()) {
        transformControlsRef.current.camera = getActiveCamera();
        transformControlsRef.current.updateMatrix();
      }
    };
    
    window.addEventListener('changeViewMode', handleViewModeChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('click', handleObjectClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('changeObjectOperation', handleOperationModeChange);
      window.removeEventListener('changeViewMode', handleViewModeChange);
      
      // 移除变换控制器
      if (transformControlsRef.current && window.scene) {
        transformControlsRef.current.removeEventListener('dragging-changed', handleDraggingChanged);
        window.scene.remove(transformControlsRef.current);
      }
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
}

export default ObjectTransformer; 
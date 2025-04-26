import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ViewCube.css';

function ViewCube() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cubeRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationFrameRef = useRef(null);

  // 初始化视图立方体
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = null; // 透明背景
    sceneRef.current = scene;

    // 创建正交相机（实现等角视图）
    const aspect = 1;
    const viewSize = 3;
    const camera = new THREE.OrthographicCamera(
      -viewSize * aspect / 2,
      viewSize * aspect / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    camera.position.set(2.5, 2.5, 2.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 立方体初始位置设置为与 isometric 视图相匹配
    const initialOrientation = () => {
      if (cubeRef.current) {
        cubeRef.current.rotation.set(
          Math.PI / 6,  // X轴旋转
          -Math.PI / 4, // Y轴旋转
          0             // Z轴不旋转
        );
      }
    };

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(80, 80); // 设置固定尺寸
    renderer.setClearColor(0x000000, 0); // 透明背景
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 处理窗口大小变化，保持渲染器尺寸
    const handleResize = () => {
      if (containerRef.current && rendererRef.current) {
        rendererRef.current.setSize(80, 80, false);
      }
    };
    window.addEventListener('resize', handleResize);

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; // 禁用缩放
    controls.enablePan = false; // 禁用平移
    controls.rotateSpeed = 0.5; // 降低旋转速度
    controls.autoRotate = false; // 自动旋转
    controls.minPolarAngle = Math.PI / 6; // 限制垂直旋转
    controls.maxPolarAngle = Math.PI / 1.5;
    controlsRef.current = controls;

    // 创建立方体材质
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // 右面 - 浅灰色
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // 左面 - 浅灰色
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // 顶面 - 浅灰色
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // 底面 - 浅灰色
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // 前面 - 浅灰色
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false })  // 后面 - 浅灰色
    ];

    // 创建立方体几何体
    const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    cubeRef.current = cube;
    
    // 添加边缘线条
    const edges = new THREE.EdgesGeometry(geometry, 1); // 阈值为1，只显示锐边
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x777777,    // 中灰色
      linewidth: 1,       // 设为标准线宽
      transparent: false, // 不透明
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.renderOrder = 1; // 确保线条在立方体面之后渲染
    cube.add(wireframe);
    
    // 为立方体添加面标签
    const labelContainer = new THREE.Group();
    cube.add(labelContainer);
    
    // 添加立方体面标签函数，将标签添加到标签容器中
    addFaceLabels(labelContainer);

    // 设置立方体初始方向为标准等角视图
    cube.rotation.set(
      Math.PI / 6,  // X轴旋转
      -Math.PI / 4, // Y轴旋转
      0             // Z轴不旋转
    );

    // 设置摄像机位置以匹配等角视图
    camera.position.set(2.2, 2.2, 2.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix(); // 确保投影矩阵更新
    controls.update();

    // 添加坐标轴辅助
    const axesHelper = new THREE.AxesHelper(1.2);
    scene.add(axesHelper);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 添加定向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // 渲染循环
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 添加点击事件
    const handleClick = (event) => {
      if (!cubeRef.current || !raycasterRef.current || !cameraRef.current) {
        console.warn('ViewCube: Required references not available');
        return;
      }
      
      try {
        // 计算鼠标在画布上的位置
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
        // 设置射线
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
  
        // 获取立方体和所有子对象
        const allObjects = [];
        cubeRef.current.traverse(object => {
          if (object.isMesh) {
            allObjects.push(object);
          }
        });
        
        // 计算与所有对象的交点
        const intersects = raycasterRef.current.intersectObjects(allObjects);
        
        if (intersects.length > 0) {
          // 找到第一个与立方体主体相交的点
          let cubeIntersect = null;
          for (const intersect of intersects) {
            // 检查是否是立方体主体（而不是标签或边框）
            if (intersect.object === cubeRef.current) {
              cubeIntersect = intersect;
              break;
            }
          }
          
          // 如果没有直接与立方体相交，取第一个交点
          const intersect = cubeIntersect || intersects[0];
          
          // 根据点击位置确定面的索引
          const localPoint = new THREE.Vector3().copy(intersect.point);
          cubeRef.current.worldToLocal(localPoint);
          
          // 找出最近的面 - 计算到各个面的距离
          const faces = [
            { axis: 'x', direction: 1, index: 0 },  // 右面 (+X)
            { axis: 'x', direction: -1, index: 1 }, // 左面 (-X)
            { axis: 'y', direction: 1, index: 2 },  // 顶面 (+Y)
            { axis: 'y', direction: -1, index: 3 }, // 底面 (-Y)
            { axis: 'z', direction: 1, index: 4 },  // 前面 (+Z)
            { axis: 'z', direction: -1, index: 5 }  // 后面 (-Z)
          ];
          
          // 立方体半边长
          const halfSize = 0.9; // 使用1.8的尺寸，半边长为0.9
          
          // 计算点到各个面的距离
          const distances = faces.map(face => {
            const coordinate = localPoint[face.axis];
            const facePosition = face.direction * halfSize;
            return {
              index: face.index,
              distance: Math.abs(coordinate - facePosition)
            };
          });
          
          // 排序找出最近的面
          distances.sort((a, b) => a.distance - b.distance);
          const faceIndex = distances[0].index;
          
          console.log(`Clicked position: (${localPoint.x.toFixed(2)}, ${localPoint.y.toFixed(2)}, ${localPoint.z.toFixed(2)}), Face: ${faceIndex}`);
          
          // 切换相机视图
          changeCameraView(faceIndex);
        }
      } catch (error) {
        console.error('ViewCube: Error in click handler:', error);
      }
    };

    rendererRef.current.domElement.addEventListener('click', handleClick);

    // 监听主场景视图变化，设置立方体初始方向
    const handleMainViewChange = (event) => {
      const mode = event.detail.mode;
      
      if (mode === 'isometric') {
        // 设置立方体旋转为等角视图固定角度
        if (cubeRef.current) {
          cubeRef.current.rotation.set(
            Math.PI / 6,  // X轴旋转
            -Math.PI / 4, // Y轴旋转
            0             // Z轴不旋转
          );
          controlsRef.current.update();
        }
      }
    };

    window.addEventListener('changeViewMode', handleMainViewChange);

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        try {
          rendererRef.current.domElement.removeEventListener('click', handleClick);
        } catch (error) {
          console.warn('ViewCube: Error removing click listener:', error);
        }
        if (containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('changeViewMode', handleMainViewChange);
      if (geometry) geometry.dispose();
      if (materials && Array.isArray(materials)) {
        materials.forEach(material => {
          if (material) material.dispose();
        });
      }
    };
  }, []);

  // 为每个面添加标签
  const addFaceLabels = (container) => {
    const targetContainer = container || cubeRef.current;
    if (!targetContainer) return;
    
    const faces = [
      { text: "Right", color: "#333333", position: [0.9, 0, 0], rotation: [0, Math.PI/2, 0], size: 1.5 },
      { text: "Left", color: "#333333", position: [-0.9, 0, 0], rotation: [0, -Math.PI/2, 0], size: 1.5 },
      { text: "Top", color: "#333333", position: [0, 0.9, 0], rotation: [-Math.PI/2, 0, 0], size: 1.5 },
      { text: "Bottom", color: "#333333", position: [0, -0.9, 0], rotation: [Math.PI/2, 0, 0], size: 1.5 },
      { text: "Front", color: "#333333", position: [0, 0, 0.9], rotation: [0, 0, 0], size: 1.5 },
      { text: "Back", color: "#333333", position: [0, 0, -0.9], rotation: [0, Math.PI, 0], size: 1.5 }
    ];

    faces.forEach(face => {
      // 创建canvas绘制文字
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      
      // 清除画布 - 透明背景
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // 设置文字
      context.fillStyle = face.color;
      context.font = 'bold 80px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(face.text, canvas.width/2, canvas.height/2);
      
      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      // 创建材质
      const material = new THREE.MeshBasicMaterial({
        map: texture, 
        transparent: true,
        renderOrder: 2 // 确保在线条之后渲染
      });
      
      // 创建几何体
      const geometry = new THREE.PlaneGeometry(face.size, face.size);
      const plane = new THREE.Mesh(geometry, material);
      plane.renderOrder = 2; // 确保在线条之后渲染
      
      // 设置位置和旋转
      plane.position.set(...face.position);
      plane.rotation.set(...face.rotation);
      
      // 添加到指定容器
      targetContainer.add(plane);
    });
  };

  // 根据点击的面切换摄像机视角
  const changeCameraView = (faceIndex) => {
    if (!window.camera || !window.camera.active || !window.orbitControls) return;
    
    let viewName = '';
    let position = new THREE.Vector3();
    let lookAt = new THREE.Vector3(0, 0, 0);
    let upVector = new THREE.Vector3(0, 1, 0); // 默认Y轴向上
    const cameraDistance = 20; // 保持一致的相机距离
    
    // 确定点击的是哪个面，设置相应的视角
    switch (faceIndex) {
      case 0: // 右面 (+X)
        viewName = 'right';
        position.set(cameraDistance, 0, 0);
        break;
      case 1: // 左面 (-X)
        viewName = 'left';
        position.set(-cameraDistance, 0, 0);
        break;
      case 2: // 顶面 (+Y)
        viewName = 'top';
        position.set(0, cameraDistance, 0);
        upVector.set(0, 0, -1); // 调整上向量为负Z轴
        break;
      case 3: // 底面 (-Y)
        viewName = 'bottom';
        position.set(0, -cameraDistance, 0);
        upVector.set(0, 0, 1); // 调整上向量为正Z轴
        break;
      case 4: // 前面 (+Z)
        viewName = 'front';
        position.set(0, 0, cameraDistance);
        break;
      case 5: // 后面 (-Z)
        viewName = 'back';
        position.set(0, 0, -cameraDistance);
        break;
      default:
        return;
    }
    
    console.log(`切换到${viewName}视图`);
    
    // 获取当前相机
    const camera = window.camera.active;
    const controls = window.orbitControls;
    
    // 禁用控制器以防止用户干扰动画
    controls.enabled = false;
    
    // 动画插值到目标位置
    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const endQuaternion = new THREE.Quaternion();
    
    // 创建一个临时相机来计算目标方向
    const tempCamera = camera.clone();
    tempCamera.position.copy(position);
    tempCamera.up.copy(upVector); // 确保在lookAt之前设置up向量
    tempCamera.lookAt(lookAt);
    endQuaternion.copy(tempCamera.quaternion);
    
    // 插值动画时间
    const duration = 500; // 毫秒
    const startTime = Date.now();
    
    function animateCamera() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数使动画更平滑
      const easeOutCubic = function(t) {
        return 1 - Math.pow(1 - t, 3);
      };
      
      const easedT = easeOutCubic(t);
      
      // 插值位置和旋转
      camera.position.lerpVectors(startPosition, position, easedT);
      camera.quaternion.slerpQuaternions(startQuaternion, endQuaternion, easedT);
      
      // 更新相机的上向量
      camera.up.copy(upVector);
      
      // 更新轨道控制器的目标
      controls.target.copy(lookAt);
      controls.update();
      
      // 继续动画或完成
      if (t < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // 动画完成后重新启用控制器
        controls.enabled = true;
        // 确保最终相机上向量设置正确
        camera.up.copy(upVector);
        controls.update();
      }
    }
    
    // 开始动画
    animateCamera();
  };

  return (
    <div ref={containerRef} className="view-cube-container">
      {/* 渲染器将在这里添加 Three.js 画布 */}
    </div>
  );
}

export default ViewCube; 
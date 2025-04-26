import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import useStore from '../store';
import ClippingPlane from './ClippingPlane';
import ObjectTransformer from './ObjectTransformer';

const BuildingModel = () => {
    const containerRef = useRef();
    const sceneRef = useRef();
    const cameraRef = useRef();
    const rendererRef = useRef();
    const controlsRef = useRef();
    const animationFrameRef = useRef();
    const roomLabelsRef = useRef([]);  // 用于存储房间标签的引用
    const wireframeRef = useRef([]);   // 用于存储所有轮廓线的引用
    const gridHelperRef = useRef();    // 用于存储网格引用
    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState(null);
    const [isOutlineVisible, setIsOutlineVisible] = useState(true); // 默认显示轮廓线
    const [stats, setStats] = useState({
        totalArea: 0,
        totalFloors: 0,
        totalRooms: 0,
        totalWalls: 0,
        totalWindows: 0,
        totalDoors: 0
    });
    
    // 从 store 获取建筑数据
    const buildingData = useStore(state => state.buildingData);

    // 初始化场景
    useEffect(() => {
        if (!containerRef.current) return;

            // 创建场景
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            sceneRef.current = scene;

            // 创建相机
            const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50000);
            camera.position.set(20, 0, 20);
            camera.lookAt(0, 0, 0);
            cameraRef.current = camera;

            // 创建正交相机（用于等角视图）
            const aspect = window.innerWidth / window.innerHeight;
            const frustumSize = 30; // 增大视野范围
            const orthographicCamera = new THREE.OrthographicCamera(
                -frustumSize * aspect / 2,
                frustumSize * aspect / 2,
                frustumSize / 2,
                -frustumSize / 2,
                0.1,
                1000
            );
            // 设置为典型的等角视图位置
            orthographicCamera.position.set(15, 15, 15);
            orthographicCamera.lookAt(0, 0, 0);
            orthographicCamera.updateProjectionMatrix();

            // 保存两种相机的引用
            cameraRef.current = {
                perspective: camera,
                orthographic: orthographicCamera,
                active: camera  // 默认使用透视相机
            };

            // 创建渲染器
            const renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // 启用局部裁剪
            renderer.localClippingEnabled = true;
            containerRef.current.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // 创建控制器 - 使用活动相机（perspective）
            const controls = new OrbitControls(cameraRef.current.active, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 5;
            controls.maxDistance = 100;  // 增加最大距离
            controls.target.set(0, 0, 0);
            
            // 添加控制器变化监听，实时更新ViewCube
            controls.addEventListener('change', () => {
                // 广播相机变化事件
                window.dispatchEvent(new CustomEvent('cameraChange', {
                    detail: {
                        camera: cameraRef.current.active
                    }
                }));
            });
            
            // 监听 Room 标签显示/隐藏事件
            const handleToggleRoomLabels = (e) => {
                const { visible } = e.detail;
                // 遍历所有房间标签，设置可见性
                if (roomLabelsRef.current) {
                    roomLabelsRef.current.forEach(label => {
                        if (label) {
                            label.visible = visible;
                        }
                    });
                }
            };
            
            window.addEventListener('toggleRoomLabels', handleToggleRoomLabels);
            
            // 监听对象轮廓显示/隐藏事件
            const handleToggleOutlines = (e) => {
                const { visible } = e.detail;
                // 更新组件状态
                setIsOutlineVisible(visible);
                // 遍历所有轮廓线，设置可见性
                if (wireframeRef.current) {
                    wireframeRef.current.forEach(wireframe => {
                        if (wireframe) {
                            wireframe.visible = visible;
                        }
                    });
                }
            };
            
            window.addEventListener('toggleOutlines', handleToggleOutlines);
            
            // 设置鼠标按键映射
            controls.mouseButtons = {
                LEFT: null,  // 禁用左键
                MIDDLE: THREE.MOUSE.PAN,  // 中键平移
                RIGHT: THREE.MOUSE.ROTATE  // 右键旋转
            };
            
            // 启用平移和缩放
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.zoomSpeed = 2.0;
            controls.rotateSpeed = 0.5;
            controls.panSpeed = 1.0;  // 添加平移速度
            
            // 添加 shift 键检测
            const handleKeyDown = (event) => {
                if (event.shiftKey) {
                    controls.mouseButtons = {
                        LEFT: null,
                        MIDDLE: THREE.MOUSE.PAN,
                        RIGHT: THREE.MOUSE.PAN  // shift + 右键平移
                    };
                }
            };
            
            const handleKeyUp = (event) => {
                if (!event.shiftKey) {
                    controls.mouseButtons = {
                        LEFT: null,
                        MIDDLE: THREE.MOUSE.PAN,
                        RIGHT: THREE.MOUSE.ROTATE  // 恢复右键旋转
                    };
                }
            };
            
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            
            controlsRef.current = controls;

            // 添加环境光和平行光
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(10, 10, 10);
            directionalLight.castShadow = true;
            
            // 调整阴影贴图大小和属性，提高阴影质量
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -20;
            directionalLight.shadow.camera.right = 20;
            directionalLight.shadow.camera.top = 20;
            directionalLight.shadow.camera.bottom = -20;
            directionalLight.shadow.bias = -0.001; // 减少阴影伪影
            
            scene.add(directionalLight);
            
            // 添加第二个方向光源，从不同角度照射，减少阴影伪影
            const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
            secondaryLight.position.set(-10, 5, -10);
            scene.add(secondaryLight);

            // 添加网格
            const gridHelper = new THREE.GridHelper(50, 50);
            scene.add(gridHelper);
            gridHelperRef.current = gridHelper;
            
            // 监听网格显示/隐藏事件
            const handleToggleGridMesh = (e) => {
                const { visible } = e.detail;
                if (gridHelperRef.current) {
                    gridHelperRef.current.visible = visible;
                }
            };
            
            window.addEventListener('toggleGridMesh', handleToggleGridMesh);

            // 动画循环
            const animate = () => {
                animationFrameRef.current = requestAnimationFrame(animate);
                controls.update();
                // 使用活动相机进行渲染
                renderer.render(scene, cameraRef.current.active);
            };

            animate();

            // 清理函数
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                window.removeEventListener('toggleRoomLabels', handleToggleRoomLabels);
                window.removeEventListener('toggleOutlines', handleToggleOutlines);
                window.removeEventListener('toggleGridMesh', handleToggleGridMesh);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (containerRef.current && renderer.domElement) {
                    containerRef.current.removeChild(renderer.domElement);
                }
                renderer.dispose();
            };
    }, []);

    // 加载和渲染JSON数据 - 初始加载
    useEffect(() => {
        if (!sceneRef.current || !isLoading) return;

        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const controls = controlsRef.current;

        // 创建材质
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            side: THREE.DoubleSide
        });
        
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x999999,
            side: THREE.DoubleSide
        });
        
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8b4513,
            side: THREE.DoubleSide
        });
        
        if (buildingData) {
            console.log('Rendering building data from store');
            
            // 渲染 JSON 数据
            renderJsonModel(buildingData, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial);
            
            // 计算模型的边界框
            const boundingBox = new THREE.Box3().setFromObject(scene);
            const center = boundingBox.getCenter(new THREE.Vector3());
            const size = boundingBox.getSize(new THREE.Vector3());
            
            // 调整相机位置以适应模型（仅在初始加载时）
            if (isLoading) {
                const maxDim = Math.max(size.x, size.y, size.z);
                // 使用perspective相机进行计算
                const perspCamera = cameraRef.current.perspective;
                const fov = perspCamera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                
                // 设置初始相机位置
                perspCamera.position.set(20, 5, 20);
                perspCamera.lookAt(center);
                controls.target.copy(center);
            }
            controls.update();
            
            setIsLoading(false);
        } else {
            // 如果没有建筑数据，尝试直接从文件加载
            console.log('Loading JSON file directly...');
            fetch('/hs.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('JSON model loaded successfully', data);
                    
                    // 渲染 JSON 数据
                    renderJsonModel(data, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial);
                    
                    // 计算模型的边界框
                    const boundingBox = new THREE.Box3().setFromObject(scene);
                    const center = boundingBox.getCenter(new THREE.Vector3());
                    const size = boundingBox.getSize(new THREE.Vector3());
                    
                    // 调整相机位置以适应模型（仅在初始加载时）
                    if (isLoading) {
                        const maxDim = Math.max(size.x, size.y, size.z);
                        // 使用perspective相机进行计算
                        const perspCamera = cameraRef.current.perspective;
                        const fov = perspCamera.fov * (Math.PI / 180);
                        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                        
                        // 设置初始相机位置
                        perspCamera.position.set(20, 0, 20);
                        perspCamera.lookAt(center);
                        controls.target.copy(center);
                    }
                    controls.update();
                    
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error loading JSON model:', error);
                    setIsLoading(false);
                });
        }
    }, [isLoading, buildingData]);

    // 监听 buildingData 变化，重新渲染模型
    useEffect(() => {
        if (!sceneRef.current || isLoading) return;
        
        console.log('Building data changed, re-rendering model');
        
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        
        // 清除当前场景中的所有对象（保留光源和网格）
        const objectsToRemove = [];
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && !(object instanceof THREE.GridHelper)) {
                objectsToRemove.push(object);
            }
            // 清除所有THREE.Sprite对象（标签）
            if (object instanceof THREE.Sprite) {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => {
            scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // 清空标签引用数组和轮廓线引用数组
        roomLabelsRef.current = [];
        wireframeRef.current = [];
        
        // 创建材质
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            side: THREE.DoubleSide
        });
        
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x999999,
            side: THREE.DoubleSide
        });
        
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8b4513,
            side: THREE.DoubleSide
        });
        
        // 渲染新的 JSON 数据
        renderJsonModel(buildingData, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial);
        
        // 计算模型的边界框
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        // 调整相机位置以适应模型（仅在初始加载时）
        if (isLoading) {
            const maxDim = Math.max(size.x, size.y, size.z);
            // 使用perspective相机进行计算
            const perspCamera = cameraRef.current.perspective;
            const fov = perspCamera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
            
            // 设置初始相机位置
            perspCamera.position.set(20, 0, 20);
            perspCamera.lookAt(center);
            controls.target.copy(center);
        }
        controls.update();
        
    }, [buildingData, isLoading]);

    // 渲染 JSON 模型
    const renderJsonModel = (data, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial) => {
        // 在渲染新模型前，清除场景中所有现有的标签
        const labelsToRemove = [];
        scene.traverse((object) => {
            if (object instanceof THREE.Sprite) {
                labelsToRemove.push(object);
            }
        });
        
        labelsToRemove.forEach(label => {
            scene.remove(label);
            if (label.material) {
                if (label.material.map) {
                    label.material.map.dispose();
                }
                label.material.dispose();
            }
        });
        
        // 清空标签引用数组和轮廓线引用数组
        roomLabelsRef.current = [];
        wireframeRef.current = [];
        
        // 计数器
        let wallCount = 0;
        let floorCount = 0;
        let windowCount = 0;
        let doorCount = 0;
        let roomCount = 0;
        let totalArea = 0;
        
        // 检查数据是否有效
        if (!data || !data.building) {
            console.error('Invalid JSON data structure');
            return;
        }
        
        const building = data.building;
        
        // 渲染楼层
        if (building.floors && Array.isArray(building.floors)) {
            floorCount = building.floors.length;
            
            // 找到最高层
            const highestFloor = building.floors.reduce((highest, floor) => {
                return (floor.level || 0) > (highest.level || 0) ? floor : highest;
            }, building.floors[0]);
            
            // 将屋顶属性移动到最高层
            if (building.roof) {
                highestFloor.roof = building.roof;
            }
            
            building.floors.forEach((floor, floorIndex) => {
                const floorHeight = (floor.height || 3000) / 1000; // 默认楼层高度为3000毫米
                const floorLevel = floor.level || floorIndex; // 默认楼层级别为索引
                
                // 获取楼层材质
                const floorMaterialColor = floor.material?.color ? parseInt(floor.material.color.replace('#', '0x')) : 0x999999;
                const floorMaterialProps = floor.material || {};
                const customFloorMaterial = new THREE.MeshPhongMaterial({ 
                    color: floorMaterialColor,
                    side: THREE.DoubleSide
                });
                
                // 渲染房间
                if (floor.rooms && Array.isArray(floor.rooms)) {
                    roomCount += floor.rooms.length;
                    
                    floor.rooms.forEach((room, roomIndex) => {
                        // 渲染房间的地板（基于footprint）
                        if (room.footprint && Array.isArray(room.footprint) && room.footprint.length >= 4) {
                            // 计算房间的宽度和深度
                            const minX = Math.min(...room.footprint.map(point => point[0]));
                            const maxX = Math.max(...room.footprint.map(point => point[0]));
                            const minY = Math.min(...room.footprint.map(point => point[1]));
                            const maxY = Math.max(...room.footprint.map(point => point[1]));
                            
                            const width = (maxX - minX) / 1000; // 转换为米
                            const depth = (maxY - minY) / 1000; // 转换为米
                            const floorThickness = (room.floor?.thickness || 200) / 1000; // 从 JSON 读取地板厚度，默认为 200 毫米
                            
                            // 计算房间的中心点
                            const centerX = (minX + maxX) / 2000; // 转换为米
                            const centerY = floorLevel * floorHeight; // 楼层高度
                            const centerZ = (minY + maxY) / 2000; // 转换为米
                            
                            // 获取房间地板材质
                            const roomFloorMaterialColor = room.floor?.material?.color ? parseInt(room.floor.material.color.replace('#', '0x')) : floorMaterialColor;
                            const roomFloorMaterialProps = room.floor?.material || {};
                            const roomFloorMaterial = new THREE.MeshPhongMaterial({ 
                                color: roomFloorMaterialColor,
                                side: THREE.DoubleSide,
                                ...roomFloorMaterialProps
                            });
                            
                            // 创建地板的网格
                            const floorGeometry = new THREE.BoxGeometry(width, floorThickness, depth);
                            const floorMesh = new THREE.Mesh(floorGeometry, roomFloorMaterial);
                            
                            // 设置地板的位置
                            floorMesh.position.set(centerX, centerY, centerZ);
                            
                            // 添加可选择标识
                            floorMesh.userData.type = 'floor';
                            floorMesh.userData.selectable = true;
                            floorMesh.userData.name = `Floor_${room.name}`;
                            
                            floorMesh.receiveShadow = true;
                            
                            // 添加边缘线条（轮廓）
                            const floorEdges = new THREE.EdgesGeometry(floorGeometry, 30);
                            const floorLinesMaterial = new THREE.LineBasicMaterial({ 
                                color: 0x000000,
                                linewidth: 1
                            });
                            const floorWireframe = new THREE.LineSegments(floorEdges, floorLinesMaterial);
                            // 根据当前组件状态设置可见性
                            floorWireframe.visible = isOutlineVisible;
                            // 添加标识，表明这是轮廓线
                            floorWireframe.userData.isOutline = true;
                            floorWireframe.userData.parentType = 'floor';
                            // 将轮廓线作为对象的子对象添加
                            floorMesh.add(floorWireframe);
                            
                            // 将轮廓线添加到引用数组中，用于控制可见性
                            wireframeRef.current.push(floorWireframe);
                            
                            scene.add(floorMesh);
                            
                            // 计算房间面积（平方米）
                            totalArea += width * depth;
                            
                            // 添加房间标签 - 使用房间名称
                            const roomName = room.name || `Room ${roomIndex + 1}`;
                            addLabel(scene, roomName, new THREE.Vector3(centerX, centerY + floorHeight/2, centerZ));
                        }
                        
                        // 渲染墙
                        if (room.walls && Array.isArray(room.walls)) {
                            wallCount += room.walls.length;
                            
                            room.walls.forEach((wall, wallIndex) => {
                                // 获取墙材质
                                const wallMaterialColor = wall.material?.color ? parseInt(wall.material.color.replace('#', '0x')) : 0xcccccc;
                                const wallMaterialProps = wall.material || {};
                                const customWallMaterial = new THREE.MeshPhongMaterial({ 
                                    color: wallMaterialColor,
                                    side: THREE.DoubleSide,
                                    transparent: true,
                                    opacity: wallMaterialProps.opacity || 1
                                });
                                
                                // 创建墙的几何体
                                const wallHeight = floorHeight; // 墙高等于楼层高
                                const wallThickness = (wall.thickness || 200) / 1000; // 转换为米，默认厚度 200 毫米
                                
                                // 计算墙的长度和方向
                                const startX = wall.start[0] / 1000; // 转换为米
                                const startY = wall.start[1] / 1000; // 转换为米
                                const endX = wall.end[0] / 1000; // 转换为米
                                const endY = wall.end[1] / 1000; // 转换为米
                                
                                const length = Math.sqrt(
                                    Math.pow(endX - startX, 2) + 
                                    Math.pow(endY - startY, 2)
                                );
                                
                                const angle = Math.atan2(endY - startY, endX - startX);
                                
                                // 创建墙的网格
                                const wallGeometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
                                const wallMesh = new THREE.Mesh(wallGeometry, customWallMaterial);
                                
                                // 设置墙的位置和旋转
                                wallMesh.position.set(
                                    (startX + endX) / 2,
                                    floorLevel * floorHeight + wallHeight / 2,
                                    (startY + endY) / 2
                                );
                                wallMesh.rotation.y = angle;
                                
                                // 添加可选择标识
                                wallMesh.userData.type = 'wall';
                                wallMesh.userData.selectable = true;
                                wallMesh.userData.name = `Wall_${wallIndex}_${room.name}`;
                                
                                wallMesh.castShadow = true;
                                wallMesh.receiveShadow = true;
                                
                                // 添加边缘线条（轮廓）
                                const wallEdges = new THREE.EdgesGeometry(wallGeometry, 30);
                                const wallLinesMaterial = new THREE.LineBasicMaterial({ 
                                    color: 0x000000,
                                    linewidth: 1
                                });
                                const wallWireframe = new THREE.LineSegments(wallEdges, wallLinesMaterial);
                                // 根据当前组件状态设置可见性
                                wallWireframe.visible = isOutlineVisible;
                                // 添加标识，表明这是轮廓线
                                wallWireframe.userData.isOutline = true;
                                wallWireframe.userData.parentType = 'wall';
                                wallMesh.add(wallWireframe);
                                
                                // 将轮廓线添加到引用数组中，用于控制可见性
                                wireframeRef.current.push(wallWireframe);
                                
                                scene.add(wallMesh);
                                
                                // 渲染窗户（如果墙上有窗户）
                                if (wall.window) {
                                    windowCount++;
                                    
                                    const windowWidth = (wall.window.width || 1000) / 1000; // 转换为米，默认宽度 1000 毫米
                                    const windowHeight = (wall.window.height || 1000) / 1000; // 转换为米，默认高度 1000 毫米
                                    const windowDepth = (wall.window.depth || 100) / 1000; // 从 JSON 读取窗户的深度，默认为 100 毫米
                                    
                                    // 获取窗户材质
                                    const windowMaterialColor = wall.window.material?.color ? parseInt(wall.window.material.color.replace('#', '0x')) : 0x88ccff;
                                    const windowMaterialProps = wall.window.material || {};
                                    const customWindowMaterial = new THREE.MeshPhongMaterial({ 
                                        color: windowMaterialColor,
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity: windowMaterialProps.opacity || 0.7
                                    });
                                    
                                    // 计算窗户的位置（相对于墙的起点）
                                    const windowPosition = Math.min((wall.window.position || 0) / 1000, length - windowWidth); // 确保窗户不会超出墙的长度
                                    const windowVerticalPosition = (wall.window.verticalPosition || 0) / 1000; // 转换为米
                                    
                                    // 创建窗户的网格
                                    const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
                                    const windowMesh = new THREE.Mesh(windowGeometry, customWindowMaterial);
                                    
                                    // 计算窗户在墙上的位置
                                    const windowX = startX + (windowPosition / length) * (endX - startX);
                                    const windowY = floorLevel * floorHeight + windowVerticalPosition + windowHeight / 2;
                                    const windowZ = startY + (windowPosition / length) * (endY - startY);
                                    
                                    // 设置窗户的位置和旋转
                                    windowMesh.position.set(windowX, windowY, windowZ);
                                    windowMesh.rotation.y = angle;
                                    
                                    // 添加可选择标识
                                    windowMesh.userData.type = 'window';
                                    windowMesh.userData.selectable = true;
                                    windowMesh.userData.name = `Window_${wallIndex}_${room.name}`;
                                    
                                    windowMesh.castShadow = true;
                                    windowMesh.receiveShadow = true;
                                    
                                    // 添加边缘线条（轮廓）
                                    const windowEdges = new THREE.EdgesGeometry(windowGeometry, 30);
                                    const windowLinesMaterial = new THREE.LineBasicMaterial({ 
                                        color: 0x000000,
                                        linewidth: 1
                                    });
                                    const windowWireframe = new THREE.LineSegments(windowEdges, windowLinesMaterial);
                                    // 根据当前组件状态设置可见性
                                    windowWireframe.visible = isOutlineVisible;
                                    // 添加标识，表明这是轮廓线
                                    windowWireframe.userData.isOutline = true;
                                    windowWireframe.userData.parentType = 'window';
                                    windowMesh.add(windowWireframe);
                                    
                                    // 将轮廓线添加到引用数组中，用于控制可见性
                                    wireframeRef.current.push(windowWireframe);
                                    
                                    scene.add(windowMesh);
                                    
                                    // 添加调试信息
                                    console.log(`Rendering window at position (${windowX}, ${windowY}, ${windowZ}) with dimensions ${windowWidth}x${windowHeight}x${windowDepth}`);
                                }
                                
                                // 渲染其他窗户（如 window2, window3 等）
                                Object.keys(wall).forEach(key => {
                                    if (key.startsWith('window') && key !== 'window') {
                                        windowCount++;
                                        const windowData = wall[key];
                                        
                                        const windowWidth = (windowData.width || 1000) / 1000; // 转换为米，默认宽度 1000 毫米
                                        const windowHeight = (windowData.height || 1000) / 1000; // 转换为米，默认高度 1000 毫米
                                        const windowDepth = (windowData.depth || 100) / 1000; // 从 JSON 读取窗户的深度，默认为 100 毫米
                                        
                                        // 获取窗户材质
                                        const windowMaterialColor = windowData.material?.color ? parseInt(windowData.material.color.replace('#', '0x')) : 0x88ccff;
                                        const windowMaterialProps = windowData.material || {};
                                        const customWindowMaterial = new THREE.MeshPhongMaterial({ 
                                            color: windowMaterialColor,
                                            side: THREE.DoubleSide,
                                            transparent: true,
                                            opacity: windowMaterialProps.opacity || 0.7
                                        });
                                        
                                        // 计算窗户的位置（相对于墙的起点）
                                        const windowPosition = Math.min((windowData.position || 0) / 1000, length - windowWidth); // 确保窗户不会超出墙的长度
                                        const windowVerticalPosition = (windowData.verticalPosition || 0) / 1000; // 转换为米
                                        
                                        // 创建窗户的网格
                                        const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
                                        const windowMesh = new THREE.Mesh(windowGeometry, customWindowMaterial);
                                        
                                        // 计算窗户在墙上的位置
                                        const windowX = startX + (windowPosition / length) * (endX - startX);
                                        const windowY = floorLevel * floorHeight + windowVerticalPosition + windowHeight / 2;
                                        const windowZ = startY + (windowPosition / length) * (endY - startY);
                                        
                                        // 设置窗户的位置和旋转
                                        windowMesh.position.set(windowX, windowY, windowZ);
                                        windowMesh.rotation.y = angle;
                                        
                                        // 添加可选择标识
                                        windowMesh.userData.type = 'window';
                                        windowMesh.userData.selectable = true;
                                        windowMesh.userData.name = `Window_${wallIndex}_${room.name}`;
                                        
                                        windowMesh.castShadow = true;
                                        windowMesh.receiveShadow = true;
                                        
                                        // 添加边缘线条（轮廓）
                                        const windowEdges = new THREE.EdgesGeometry(windowGeometry, 30);
                                        const windowLinesMaterial = new THREE.LineBasicMaterial({ 
                                            color: 0x000000,
                                            linewidth: 1
                                        });
                                        const windowWireframe = new THREE.LineSegments(windowEdges, windowLinesMaterial);
                                        // 根据当前组件状态设置可见性
                                        windowWireframe.visible = isOutlineVisible;
                                        // 添加标识，表明这是轮廓线
                                        windowWireframe.userData.isOutline = true;
                                        windowWireframe.userData.parentType = 'window';
                                        windowMesh.add(windowWireframe);
                                        
                                        // 将轮廓线添加到引用数组中，用于控制可见性
                                        wireframeRef.current.push(windowWireframe);
                                        
                                        scene.add(windowMesh);
                                        
                                        // 添加调试信息
                                        console.log(`Rendering ${key} at position (${windowX}, ${windowY}, ${windowZ}) with dimensions ${windowWidth}x${windowHeight}x${windowDepth}`);
                                    }
                                });
                                
                                // 渲染门（如果墙上有门）
                                if (wall.door) {
                                    doorCount++;
                                    
                                    const doorWidth = (wall.door.width || 1000) / 1000; // 转换为米，默认宽度 1000 毫米
                                    const doorHeight = (wall.door.height || 2000) / 1000; // 转换为米，默认高度 2000 毫米
                                    const doorDepth = (wall.door.depth || 100) / 1000; // 从 JSON 读取门的深度，默认为 100 毫米
                                    
                                    // 获取门材质
                                    const doorMaterialColor = wall.door.material?.color ? parseInt(wall.door.material.color.replace('#', '0x')) : 0x8b4513;
                                    const doorMaterialProps = wall.door.material || {};
                                    const customDoorMaterial = new THREE.MeshPhongMaterial({ 
                                        color: doorMaterialColor,
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity: doorMaterialProps.opacity || 0.75
                                    });
                                    
                                    // 计算门的位置（相对于墙的起点）
                                    const doorPosition = (wall.door.position || 0) / 1000; // 转换为米
                                    
                                    // 创建门的网格
                                    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
                                    const doorMesh = new THREE.Mesh(doorGeometry, customDoorMaterial);
                                    
                                    // 计算门在墙上的位置
                                    const doorX = startX + (doorPosition / length) * (endX - startX);
                                    const doorY = floorLevel * floorHeight + doorHeight / 2;
                                    const doorZ = startY + (doorPosition / length) * (endY - startY);
                                    
                                    // 设置门的位置和旋转
                                    doorMesh.position.set(doorX, doorY, doorZ);
                                    doorMesh.rotation.y = angle;
                                    
                                    // 添加可选择标识
                                    doorMesh.userData.type = 'door';
                                    doorMesh.userData.selectable = true;
                                    doorMesh.userData.name = `Door_${wallIndex}_${room.name}`;
                                    
                                    doorMesh.castShadow = true;
                                    doorMesh.receiveShadow = true;
                                    
                                    // 添加边缘线条（轮廓）
                                    const doorEdges = new THREE.EdgesGeometry(doorGeometry, 30);
                                    const doorLinesMaterial = new THREE.LineBasicMaterial({ 
                                        color: 0x000000,
                                        linewidth: 1
                                    });
                                    const doorWireframe = new THREE.LineSegments(doorEdges, doorLinesMaterial);
                                    // 根据当前组件状态设置可见性
                                    doorWireframe.visible = isOutlineVisible;
                                    // 添加标识，表明这是轮廓线
                                    doorWireframe.userData.isOutline = true;
                                    doorWireframe.userData.parentType = 'door';
                                    doorMesh.add(doorWireframe);
                                    
                                    // 将轮廓线添加到引用数组中，用于控制可见性
                                    wireframeRef.current.push(doorWireframe);
                                    
                                    scene.add(doorMesh);
                                }
                            });
                        }
                    });

                    // 渲染楼层屋顶（如果楼层有屋顶）
                    if (floor.roof) {
                        const roof = floor.roof;
                        const roofType = roof.type || 'gabled'; // 屋顶类型
                        
                        // 计算整个楼层的边界
                        const floorFootprint = floor.rooms.reduce((acc, room) => {
                            if (room.footprint && Array.isArray(room.footprint)) {
                                acc.push(...room.footprint);
                            }
                            return acc;
                        }, []);
                        
                        if (floorFootprint.length > 0) {
                            const minX = Math.min(...floorFootprint.map(point => point[0]));
                            const maxX = Math.max(...floorFootprint.map(point => point[0]));
                            const minY = Math.min(...floorFootprint.map(point => point[1]));
                            const maxY = Math.max(...floorFootprint.map(point => point[1]));
                            
                            const centerX = (minX + maxX) / 2000; // 转换为米
                            const centerY = floorLevel * floorHeight; // 楼层高度
                            const centerZ = (minY + maxY) / 2000; // 转换为米
                            
                            // 根据屋顶类型选择不同的渲染组件
                            switch (roofType) {
                                case 'gabled':
                                    renderGabledRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                                    break;
                                case 'flat':
                                    renderFlatRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                                    break;
                                case 'pitched':
                                    renderPitchedRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                                    break;
                                default:
                                    // 默认使用山形屋顶
                                    renderGabledRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                            }
                        }
                    }
                }
            });
        }
        
        // 更新统计数据
        setStats({
            totalArea: Math.round(totalArea),
            totalFloors: floorCount,
            totalRooms: roomCount,
            totalWalls: wallCount,
            totalWindows: windowCount,
            totalDoors: doorCount
        });
    };
    
    // 渲染山形屋顶组件
    const renderGabledRoof = (scene, room, floor, centerX, centerY, centerZ, floorHeight) => {
        // 从楼层获取屋顶属性
        const roof = floor.roof;
        
        // 检查屋顶对象是否存在，其他属性使用默认值
        if (!roof) {
            console.error('Missing roof object in JSON data');
            return;
        }
        
        // 使用默认值如果属性不存在
        const roofHeight = (roof.height || 1000) / 1000; // 默认高度 1000 毫米
        const roofOverhang = (roof.overhang || 300) / 1000; // 默认悬挑 300 毫米
        const roofPitch = roof.pitch || 30; // 默认坡度 30 度
        
        // 获取屋顶材质
        const roofMaterialColor = roof.material?.color ? parseInt(roof.material.color.replace('#', '0x')) : 0x8b4513;
        const roofMaterialProps = roof.material || {};
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: roofMaterialColor,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: roofMaterialProps.opacity || 0.75
        });
        
        // 使用房间的 footprint 计算屋顶尺寸
        // 检查 room 是否是一个房间对象（有 footprint 属性）或者是楼层对象
        let footprint;
        if (room.footprint && Array.isArray(room.footprint)) {
            // 如果 room 是房间对象，直接使用其 footprint
            footprint = room.footprint;
        } else if (room.rooms && Array.isArray(room.rooms)) {
            // 如果 room 是楼层对象，收集所有房间的 footprint 点
            footprint = room.rooms.reduce((acc, r) => {
                if (r.footprint && Array.isArray(r.footprint)) {
                    acc.push(...r.footprint);
                }
                return acc;
            }, []);
        } else {
            console.error('Invalid room or floor object for roof rendering');
            return;
        }
        
        const minX = Math.min(...footprint.map(point => point[0]));
        const maxX = Math.max(...footprint.map(point => point[0]));
        const minY = Math.min(...footprint.map(point => point[1]));
        const maxY = Math.max(...footprint.map(point => point[1]));
        
        const width = (maxX - minX) / 1000; // 转换为米
        const depth = (maxY - minY) / 1000; // 转换为米
        
        // 计算屋顶的宽度和深度（包括悬挑）
        const roofWidth = width + (2 * roofOverhang);
        const roofDepth = depth + (2 * roofOverhang);
        
        // 创建山形屋顶 - 使用两个四边形面
        // 根据屋顶坡度计算屋顶高度
        const pitchRadians = (roofPitch * Math.PI) / 180;
        // 使用屋顶坡度计算屋顶高度，屋顶坡度越大，高度越高
        const roofHeightAtCenter = roofHeight * Math.tan(pitchRadians) + roofHeight;
        
        // 前四边形
        const frontGeometry = new THREE.BufferGeometry();
        const frontVertices = new Float32Array([
            -roofWidth/2, 0, -roofDepth/2,           // 左下
            roofWidth/2, 0, -roofDepth/2,            // 右下
            roofWidth/2, 0, roofDepth/2,             // 右上
            -roofWidth/2, 0, roofDepth/2,            // 左上
            0, roofHeightAtCenter, 0                 // 顶点
        ]);
        
        // 定义面的索引（两个三角形组成一个四边形）
        const frontIndices = new Uint32Array([
            0, 1, 4,  // 第一个三角形
            1, 2, 4,  // 第二个三角形
            2, 3, 4,  // 第三个三角形
            3, 0, 4   // 第四个三角形
        ]);
        
        frontGeometry.setAttribute('position', new THREE.BufferAttribute(frontVertices, 3));
        frontGeometry.setIndex(new THREE.BufferAttribute(frontIndices, 1));
        frontGeometry.computeVertexNormals();
        
        const frontRoof = new THREE.Mesh(frontGeometry, roofMaterial);
        frontRoof.position.set(centerX, centerY + floorHeight, centerZ);
        frontRoof.castShadow = true;
        frontRoof.receiveShadow = true;
        
        // 添加可选择标识
        frontRoof.userData.type = 'roof';
        frontRoof.userData.selectable = true;
        frontRoof.userData.name = `Roof_Gabled_Front`;
        
        // 添加屋顶边缘线条（轮廓）
        const roofEdges = new THREE.EdgesGeometry(frontGeometry, 30);
        const roofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const roofWireframe = new THREE.LineSegments(roofEdges, roofLinesMaterial);
        // 根据当前组件状态设置可见性
        roofWireframe.visible = isOutlineVisible;
        // 添加标识，表明这是轮廓线
        roofWireframe.userData.isOutline = true;
        roofWireframe.userData.parentType = 'roof';
        frontRoof.add(roofWireframe);
        
        // 将轮廓线添加到引用数组中，用于控制可见性
        wireframeRef.current.push(roofWireframe);
        
        scene.add(frontRoof);
        
        // 后四边形
        const backGeometry = new THREE.BufferGeometry();
        const backVertices = new Float32Array([
            -roofWidth/2, 0, -roofDepth/2,           // 左下
            roofWidth/2, 0, -roofDepth/2,            // 右下
            roofWidth/2, 0, roofDepth/2,             // 右上
            -roofWidth/2, 0, roofDepth/2,            // 左上
            0, roofHeightAtCenter, 0                 // 顶点
        ]);
        
        // 定义面的索引（两个三角形组成一个四边形）
        const backIndices = new Uint32Array([
            0, 4, 1,  // 第一个三角形
            1, 4, 2,  // 第二个三角形
            2, 4, 3,  // 第三个三角形
            3, 4, 0   // 第四个三角形
        ]);
        
        backGeometry.setAttribute('position', new THREE.BufferAttribute(backVertices, 3));
        backGeometry.setIndex(new THREE.BufferAttribute(backIndices, 1));
        backGeometry.computeVertexNormals();
        
        const backRoof = new THREE.Mesh(backGeometry, roofMaterial);
        backRoof.position.set(centerX, centerY + floorHeight, centerZ);
        backRoof.castShadow = true;
        backRoof.receiveShadow = true;
        
        // 添加可选择标识
        backRoof.userData.type = 'roof';
        backRoof.userData.selectable = true;
        backRoof.userData.name = `Roof_Gabled_Back`;
        
        // 添加后屋顶边缘线条（轮廓）
        const backRoofEdges = new THREE.EdgesGeometry(backGeometry, 30);
        const backRoofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const backRoofWireframe = new THREE.LineSegments(backRoofEdges, backRoofLinesMaterial);
        // 根据当前组件状态设置可见性
        backRoofWireframe.visible = isOutlineVisible;
        // 添加标识，表明这是轮廓线
        backRoofWireframe.userData.isOutline = true;
        backRoofWireframe.userData.parentType = 'roof';
        backRoof.add(backRoofWireframe);
        
        // 将轮廓线添加到引用数组中，用于控制可见性
        wireframeRef.current.push(backRoofWireframe);
        
        scene.add(backRoof);
    };
    
    // 渲染平屋顶组件
    const renderFlatRoof = (scene, room, floor, centerX, centerY, centerZ, floorHeight) => {
        // 从楼层获取屋顶属性
        const roof = floor.roof;
        
        // 检查屋顶对象是否存在，其他属性使用默认值
        if (!roof) {
            console.error('Missing roof object in JSON data');
            return;
        }
        
        // 使用默认值如果属性不存在
        const roofThickness = (roof.thickness || 200) / 1000; // 默认厚度 200 毫米
        const roofOverhang = (roof.overhang || 300) / 1000; // 默认悬挑 300 毫米
        
        // 获取屋顶材质
        const roofMaterialColor = roof.material?.color ? parseInt(roof.material.color.replace('#', '0x')) : 0x8b4513;
        const roofMaterialProps = roof.material || {};
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: roofMaterialColor,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: roofMaterialProps.opacity || 0.75
        });
        
        // 使用房间的 footprint 计算屋顶尺寸
        // 检查 room 是否是一个房间对象（有 footprint 属性）或者是楼层对象
        let footprint;
        if (room.footprint && Array.isArray(room.footprint)) {
            // 如果 room 是房间对象，直接使用其 footprint
            footprint = room.footprint;
        } else if (room.rooms && Array.isArray(room.rooms)) {
            // 如果 room 是楼层对象，收集所有房间的 footprint 点
            footprint = room.rooms.reduce((acc, r) => {
                if (r.footprint && Array.isArray(r.footprint)) {
                    acc.push(...r.footprint);
                }
                return acc;
            }, []);
        } else {
            console.error('Invalid room or floor object for roof rendering');
            return;
        }
        
        const minX = Math.min(...footprint.map(point => point[0]));
        const maxX = Math.max(...footprint.map(point => point[0]));
        const minY = Math.min(...footprint.map(point => point[1]));
        const maxY = Math.max(...footprint.map(point => point[1]));
        
        const width = (maxX - minX) / 1000; // 转换为米
        const depth = (maxY - minY) / 1000; // 转换为米
        
        // 计算屋顶的宽度和深度（包括悬挑）
        const roofWidth = width + (2 * roofOverhang);
        const roofDepth = depth + (2 * roofOverhang);
        
        // 创建平屋顶
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofThickness, roofDepth);
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        
        // 设置屋顶的位置
        roofMesh.position.set(centerX, centerY + floorHeight + roofThickness/2, centerZ);
        
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        
        // 添加可选择标识
        roofMesh.userData.type = 'roof';
        roofMesh.userData.selectable = true;
        roofMesh.userData.name = `Roof_Flat`;
        
        // 添加平屋顶边缘线条（轮廓）
        const flatRoofEdges = new THREE.EdgesGeometry(roofGeometry, 30);
        const flatRoofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const flatRoofWireframe = new THREE.LineSegments(flatRoofEdges, flatRoofLinesMaterial);
        // 根据当前组件状态设置可见性
        flatRoofWireframe.visible = isOutlineVisible;
        // 添加标识，表明这是轮廓线
        flatRoofWireframe.userData.isOutline = true;
        flatRoofWireframe.userData.parentType = 'roof';
        roofMesh.add(flatRoofWireframe);
        
        // 将轮廓线添加到引用数组中，用于控制可见性
        wireframeRef.current.push(flatRoofWireframe);
        
        scene.add(roofMesh);
    };
    
    // 渲染斜屋顶组件
    const renderPitchedRoof = (scene, room, floor, centerX, centerY, centerZ, floorHeight) => {
        // 从楼层获取屋顶属性
        const roof = floor.roof;
        
        // 检查屋顶对象是否存在，其他属性使用默认值
        if (!roof) {
            console.error('Missing roof object in JSON data');
            return;
        }
        
        // 使用默认值如果属性不存在
        const roofHeight = (roof.height || 1000) / 1000; // 默认高度 1000 毫米
        const roofOverhang = (roof.overhang || 300) / 1000; // 默认悬挑 300 毫米
        const roofPitch = roof.pitch || 15; // 默认坡度 15 度
        
        // 获取屋顶材质
        const roofMaterialColor = roof.material?.color ? parseInt(roof.material.color.replace('#', '0x')) : 0x8b4513;
        const roofMaterialProps = roof.material || {};
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: roofMaterialColor,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: roofMaterialProps.opacity || 0.75
        });
        
        // 使用房间的 footprint 计算屋顶尺寸
        // 检查 room 是否是一个房间对象（有 footprint 属性）或者是楼层对象
        let footprint;
        if (room.footprint && Array.isArray(room.footprint)) {
            // 如果 room 是房间对象，直接使用其 footprint
            footprint = room.footprint;
        } else if (room.rooms && Array.isArray(room.rooms)) {
            // 如果 room 是楼层对象，收集所有房间的 footprint 点
            footprint = room.rooms.reduce((acc, r) => {
                if (r.footprint && Array.isArray(r.footprint)) {
                    acc.push(...r.footprint);
                }
                return acc;
            }, []);
        } else {
            console.error('Invalid room or floor object for roof rendering');
            return;
        }
        
        const minX = Math.min(...footprint.map(point => point[0]));
        const maxX = Math.max(...footprint.map(point => point[0]));
        const minY = Math.min(...footprint.map(point => point[1]));
        const maxY = Math.max(...footprint.map(point => point[1]));
        
        const width = (maxX - minX) / 1000; // 转换为米
        const depth = (maxY - minY) / 1000; // 转换为米
        
        // 计算屋顶的宽度和深度（包括悬挑）
        const roofWidth = width + (2 * roofOverhang);
        const roofDepth = depth + (2 * roofOverhang);
        
        // 计算斜屋顶的高度
        const pitchRadians = (roofPitch * Math.PI) / 180;
        const roofHeightAtEnd = roofHeight * Math.tan(pitchRadians);
        
        // 创建斜屋顶的几何体
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-roofWidth/2, 0);
        roofShape.lineTo(roofWidth/2, 0);
        roofShape.lineTo(roofWidth/2, roofHeightAtEnd);
        roofShape.lineTo(-roofWidth/2, roofHeightAtEnd);
        roofShape.lineTo(-roofWidth/2, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: roofDepth,
            bevelEnabled: false
        };
        
        const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        
        // 设置屋顶的位置和旋转
        roofMesh.position.set(centerX, centerY + floorHeight, centerZ - roofDepth/2);
        roofMesh.rotation.x = -Math.PI / 2; // 旋转到水平面
        
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        
        // 添加可选择标识
        roofMesh.userData.type = 'roof';
        roofMesh.userData.selectable = true;
        roofMesh.userData.name = `Roof_Pitched`;
        
        // 添加斜屋顶边缘线条（轮廓）
        const pitchedRoofEdges = new THREE.EdgesGeometry(roofGeometry, 30);
        const pitchedRoofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const pitchedRoofWireframe = new THREE.LineSegments(pitchedRoofEdges, pitchedRoofLinesMaterial);
        // 根据当前组件状态设置可见性
        pitchedRoofWireframe.visible = isOutlineVisible;
        // 添加标识，表明这是轮廓线
        pitchedRoofWireframe.userData.isOutline = true;
        pitchedRoofWireframe.userData.parentType = 'roof';
        roofMesh.add(pitchedRoofWireframe);
        
        // 将轮廓线添加到引用数组中，用于控制可见性
        wireframeRef.current.push(pitchedRoofWireframe);
        
        scene.add(roofMesh);
    };
    
    // 修改 addLabel 函数，以便跟踪 room 标签
    const addLabel = (scene, text, position) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Increase canvas size to accommodate longer text
        canvas.width = 512;
        canvas.height = 128;
        
        // Clear the canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties with Lexend font
        context.font = '36px Lexend, sans-serif';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text in the center of the canvas
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.transparent = true;
        
        const labelMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        const label = new THREE.Sprite(labelMaterial);
        label.position.copy(position);
        label.position.y += 0; // 0: middle, 1: top
        label.scale.set(8, 2, 1); // Increased scale to make text more visible
        
        // 默认隐藏所有标签
        label.visible = false;
        // 将所有标签添加到引用集合中
        roomLabelsRef.current.push(label);
        
        scene.add(label);
    };

    // 将场景、相机、渲染器和控制器暴露给全局，以便 ClippingPlane 组件可以访问
    useEffect(() => {
        if (sceneRef.current && cameraRef.current && rendererRef.current && controlsRef.current) {
            window.scene = sceneRef.current;
            window.camera = cameraRef.current;
            window.renderer = rendererRef.current;
            window.orbitControls = controlsRef.current;
        }
    }, []);

    // 添加事件监听器，处理视角模式变更
    useEffect(() => {
        // 处理视角模式变更
        const handleViewModeChange = (event) => {
            if (!cameraRef.current) return;
            
            const mode = event.detail.mode;
            const position = event.detail.position;
            
            if (mode === 'isometric') {
                // 切换到等角(isometric)视图
                const orthoCamera = cameraRef.current.orthographic;
                
                // 将控制器连接到正交相机
                controlsRef.current.object = orthoCamera;
                
                // 更新活动相机
                cameraRef.current.active = orthoCamera;
                
                console.log('切换到等角视图');
            } else if (mode === 'perspective') {
                // 切换到透视(perspective)视图
                const perspCamera = cameraRef.current.perspective;
                
                // 如果提供了位置，则移动相机到指定位置
                if (position) {
                    perspCamera.position.set(position[0], position[1], position[2]);
                    
                    // 将相机朝向场景中心
                    perspCamera.lookAt(0, 0, 0);
                    
                    // 更新轨道控制器的目标点
                    controlsRef.current.target.set(0, 0, 0);
                    
                    console.log(`相机位置已设置为 [${position.join(', ')}]`);
                }
                
                // 将控制器连接到透视相机
                controlsRef.current.object = perspCamera;
                
                // 更新活动相机
                cameraRef.current.active = perspCamera;
                
                console.log('切换到透视视图');
            }
            
            // 更新控制器
            controlsRef.current.update();
        };
        
        // 添加事件监听
        window.addEventListener('changeViewMode', handleViewModeChange);
        
        // 清理函数
        return () => {
            window.removeEventListener('changeViewMode', handleViewModeChange);
        };
    }, []);

    // 监听对象选择状态变化
    useEffect(() => {
        const handleObjectSelected = (e) => {
            const { selected, info } = e.detail;
            if (selected && info) {
                setSelectedObject(info);
            } else {
                setSelectedObject(null);
            }
        };

        window.addEventListener('objectSelected', handleObjectSelected);
        return () => {
            window.removeEventListener('objectSelected', handleObjectSelected);
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            <ClippingPlane />
            <ObjectTransformer />
            <div style={{
                position: 'absolute',
                top: '5%',
                left: '5%',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily: 'Lexend, sans-serif',
                opacity: 0.75
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}><strong>Statistics</strong></h3>
                <div style={{ marginBottom: '5px' }}>
                    Total Area: {stats.totalArea} m²
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Total Floors: {stats.totalFloors}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Total Rooms: {stats.totalRooms}
                </div>
                {/* <div style={{ marginBottom: '5px' }}>
                    <strong>Total Walls:</strong> {stats.totalWalls}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    <strong>Total Windows:</strong> {stats.totalWindows}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    <strong>Total Doors:</strong> {stats.totalDoors}
                </div> */}
            </div>
            
            {selectedObject && (
                <div style={{
                    position: 'absolute',
                    top: '5%',
                    right: '5%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontFamily: 'Lexend, sans-serif',
                    minWidth: '200px',
                    opacity: 0.75
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}><strong>Selected Object</strong></h3>
                    <div style={{ marginBottom: '5px' }}>
                        Name: {selectedObject.name}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        Type: {selectedObject.type}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        Position: [{selectedObject.position.join(', ')}]
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingModel; 
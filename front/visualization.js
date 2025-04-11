const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
const earthTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const normalMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const suspiciousMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const markers = [];

let autoRotate = true;
let showMarkers = true;
let rotationSpeed = 0.004;

camera.position.z = 7;

document.getElementById('toggle-rotation').addEventListener('click', () => {
    autoRotate = !autoRotate;
    document.getElementById('toggle-rotation').textContent = 
        autoRotate ? 'Pause Rotation' : 'Resume Rotation';
});

document.getElementById('toggle-markers').addEventListener('click', () => {
    showMarkers = !showMarkers;
    markers.forEach(marker => marker.visible = showMarkers);
    document.getElementById('toggle-markers').textContent = 
        showMarkers ? 'Hide Markers' : 'Show Markers';
});

function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

async function updateMarkers() {
    const response = await fetch('http://localhost:5000/api/packages');
    const packages = await response.json();
    markers.forEach(marker => earth.remove(marker));
    markers.length = 0;
    packages.forEach(pkg => {
        const position = latLongToVector3(pkg.latitude, pkg.longitude, 5.1);
        const material = pkg.suspicious === '1' ? suspiciousMaterial : normalMaterial;
        const marker = new THREE.Mesh(markerGeometry, material);
        marker.position.copy(position);
        marker.lookAt(new THREE.Vector3(0, 0, 0));
        earth.add(marker);
        markers.push(marker);
        marker.userData = pkg;
        marker.onClick = function() {
            document.getElementById('info').innerHTML = `
                <strong>Location:</strong> ${pkg.latitude}, ${pkg.longitude}<br>
                <strong>IP:</strong> ${pkg.ip_address || 'N/A'}<br>
                ${pkg.suspicious === '1' ? '⚠️ SUSPICIOUS' : ''}
            `;
        };
    });
    
    document.getElementById('info').textContent = `Loaded ${packages.length} GPS points`;
}

function onMouseClick(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(markers);
    if (intersects.length > 0) {
        intersects[0].object.onClick();
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (autoRotate) {
        earth.rotation.y += rotationSpeed;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', onMouseClick, false);
updateMarkers();
animate();
setInterval(updateMarkers, 5000);
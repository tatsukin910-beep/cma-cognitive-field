import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ───────────────────────────────────────────────────────────────
// CMA Cognitive Field — Hybrid v5.0
// React構造 + HTML版UI/テレメトリ + 手動/自動(Invisible Witness)ハイブリッド
// ───────────────────────────────────────────────────────────────

const LAYER_DEFINITIONS = [
  { name: 'Isolation',      radius: 140, color: 0x5ab8ff, size: 1.3, clip: false },
  { name: 'Dependency',     radius: 105, color: 0xffc45a, size: 1.2, clip: false },
  { name: 'Normalization',  radius: 75,  color: 0xc285ff, size: 1.1, clip: false },
  { name: 'Institution',    radius: 48,  color: 0xff7070, size: 1.2, clip: true },
  { name: 'Somatization',   radius: 25,  color: 0x6ff0c0, size: 1.5, clip: false },
];

// 各Observerモードのカメラ目標値と解説文
const VIEW_MODES = {
  A: {
    label: 'OBSERVER A: EXTERNAL VIEW',
    radius: 420, targetY: 160, speedMult: 0.12,
    status: '「分類可能な層」として生きづらさをマクロに鳥瞰する客観主義的観点。',
    ambiguity: 'LOW (CLASSIFIED)',
  },
  B: {
    label: 'OBSERVER B: SUPPORT VIEW',
    radius: 160, targetY: 20, speedMult: 0.3,
    status: '支援の空白（欠損）と制度の枠組み（Institution）にフォーカスするメソ（仲介的）観点。',
    ambiguity: 'MEDIUM',
  },
  C: {
    label: 'OBSERVER C: LIVED EXPERIENCE',
    radius: 28, targetY: -30, speedMult: 0.6,
    status: '外層の構造が崩壊し、最深部の身体化（Somatization）のリズムと生命軸が直結する当事者主観の現象学的世界。',
    ambiguity: 'MAX (RAW_LIVED)',
  },
};
const MODE_ORDER = ['A', 'B', 'C'];

// 手動選択後、この時間(ms)操作がなければ自動巡回(Invisible Witness)へ復帰
const AUTO_RESUME_DELAY = 20000;
const AUTO_CYCLE_INTERVAL = 14000;

// ソフトな円形グローテクスチャを生成する。
// 個々の点の輪郭を溶かし、隣接する点同士を滲ませて「連続した帯」に見せるための錫視装置。
// これがないとは1200点各々の位置が独立したドットとして視認され、ミクロなノイズに見えてしまう。
function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function CognitiveField() {
  const mountRef = useRef(null);
  const telemetryRef = useRef(null);
  const statusRef = useRef(null);

  // UI表示用state（ボタンのactive表示、AUTOバッジ表示のみ再レンダーが必要）
  const [currentMode, setCurrentMode] = useState('A');
  const [isAuto, setIsAuto] = useState(true);

  // アニメーションループ内から読む「今の状態」— 再レンダーを起こさないためrefで保持
  const modeRef = useRef('A');
  const autoRef = useRef(true);
  const lastInteractionRef = useRef(0);
  const autoCycleAccumRef = useRef(0);

  const handleSelect = (mode) => {
    modeRef.current = mode;
    autoRef.current = false;
    lastInteractionRef.current = performance.now();
    setCurrentMode(mode);
    setIsAuto(false);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      4000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── 5層の点群構築 ──
    const glowTexture = createGlowTexture();
    const layerSystems = [];
    const pointsPerLayer = 1200;
    const cylinderHeight = 350;

    LAYER_DEFINITIONS.forEach((def, index) => {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const initialData = [];

      for (let i = 0; i < pointsPerLayer; i++) {
        const theta = (i / pointsPerLayer) * Math.PI * 2 + index * 0.5;
        const y = ((i * 0.731) % 1 - 0.5) * cylinderHeight;
        if (def.clip && theta > Math.PI * 0.3 && theta < Math.PI * 0.7) continue;

        const x = def.radius * Math.cos(theta);
        const z = def.radius * Math.sin(theta);
        positions.push(x, y, z);
        initialData.push({ y, theta, baseRadius: def.radius, seed: i });
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: def.color,
        size: def.size * 3.2,
        map: glowTexture,
        alphaTest: 0.01,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      layerSystems.push({ points, def, initialData, index });
    });

    // 中心軸
    const axisSegments = 300;
    const axisPositions = [];
    for (let i = 0; i <= axisSegments; i++) {
      axisPositions.push(0, (i / axisSegments - 0.5) * cylinderHeight, 0);
    }
    const axisGeometry = new THREE.BufferGeometry();
    axisGeometry.setAttribute('position', new THREE.Float32BufferAttribute(axisPositions, 3));
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const centralAxis = new THREE.Line(axisGeometry, axisMaterial);
    scene.add(centralAxis);

    // ── 残像(トレイル)レイヤー ──
    // 毎フレーム画面を完全に消さず、薄い黒の板を重ねることで前フレームの光跡を
    // わずかに残す。これにより無数の点の細かい動きが「一続りの流れ」として
    // 知視される（残像現象=persistence of visionの応用）。ミクロな粒度を
    // マクロな連続体に変換する主要な錫視装置。
    renderer.autoClear = false;
    const trailScene = new THREE.Scene();
    const trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const trailQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), trailMaterial);
    trailScene.add(trailQuad);

    // カメラ状態（現在値・目標値をイージングで補間）
    const target = { radius: 420, targetY: 160, speedMult: 0.12 };
    const current = { radius: 420, targetY: 160, speedMult: 0.12, angle: 0 };

    const startTime = performance.now();
    let animationFrameId;

    function animate(now) {
      const t = (now - startTime) * 0.001;

      // ── 手動操作からの経過時間で自動巡回への復帰を判定 ──
      if (!autoRef.current && now - lastInteractionRef.current > AUTO_RESUME_DELAY) {
        autoRef.current = true;
        autoCycleAccumRef.current = 0;
        setIsAuto(true);
      }

      // ── 自動巡回（Invisible Witness）: 定期周期でモードを進める ──
      if (autoRef.current) {
        autoCycleAccumRef.current += 16.67; // ~1フレーム分(ms)を概算加算
        if (autoCycleAccumRef.current >= AUTO_CYCLE_INTERVAL) {
          autoCycleAccumRef.current = 0;
          const nextIdx = (MODE_ORDER.indexOf(modeRef.current) + 1) % MODE_ORDER.length;
          modeRef.current = MODE_ORDER[nextIdx];
          setCurrentMode(modeRef.current);
        }
      }

      const view = VIEW_MODES[modeRef.current];
      target.radius = view.radius;
      target.targetY = view.targetY;
      target.speedMult = view.speedMult;

      current.radius += (target.radius - current.radius) * 0.04;
      current.targetY += (target.targetY - current.targetY) * 0.04;
      current.speedMult += (target.speedMult - current.speedMult) * 0.04;
      current.angle += 0.018 * current.speedMult;

      const camX = current.radius * Math.cos(current.angle);
      const camZ = current.radius * Math.sin(current.angle);
      const camY = current.targetY + Math.sin(t * 0.3) * 18;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, current.targetY * 0.3, 0);

      const mode = modeRef.current;

      layerSystems.forEach((sys) => {
        const { points, def, initialData, index } = sys;
        const positions = points.geometry.attributes.position.array;
        points.rotation.y = t * (0.02 + index * 0.01) * (index % 2 === 0 ? 1 : -1);

        for (let i = 0; i < initialData.length; i++) {
          const data = initialData[i];
          const idx = i * 3;
          // 空間周波数を低く拑え、点ごとのバラバラな揺れではなく層全体としての
          // 少数の大きなうねりに集約する（=個の集合ではなく一つの塊として錫視させる）
          const wave = Math.sin(t * 2.0 + data.theta * 2 + data.y * 0.02);
          let rOffset = 0;
          let yOffset = 0;

          if (def.name === 'Isolation') rOffset = wave * 10.0;
          else if (def.name === 'Dependency') rOffset = Math.cos(t * 1.2 + data.theta * 1.5) * 14.0;
          else if (def.name === 'Normalization') rOffset = Math.sin(t * 1.8 + data.theta * 2) * 6.0;
          else if (def.name === 'Institution') yOffset = wave * 15.0;
          else if (def.name === 'Somatization') {
            // 個々の点のseedノイズを廃止し、層全体が同じ位相で脈打つ「一つの生命体の呵吸」に統一
            rOffset = Math.sin(t * 2.2) * 6.0;
          }

          const displayRadius = data.baseRadius + rOffset;
          positions[idx] = displayRadius * Math.cos(data.theta);
          positions[idx + 1] = data.y + yOffset;
          positions[idx + 2] = displayRadius * Math.sin(data.theta);
        }
        points.geometry.attributes.position.needsUpdate = true;

        // エピステミック・フィルター（モードごとの可視性変容）
        let opacity = 0.3;
        if (mode === 'A') {
          opacity = 0.45;
        } else if (mode === 'B') {
          opacity = def.name === 'Institution' ? 0.65 + Math.sin(t * 3) * 0.1 : def.name === 'Somatization' ? 0.05 : 0.2;
        } else if (mode === 'C') {
          opacity = def.name === 'Somatization' ? 0.8 : def.name === 'Institution' ? 0.4 : 0.03;
        }
        points.material.opacity = opacity;
      });

      // Observer Cでは中心軸自体が揺らぐ（生の身体性の表現）
      const axisPos = centralAxis.geometry.attributes.position.array;
      if (mode === 'C') {
        for (let i = 0; i <= axisSegments; i++) {
          const idx = i * 3;
          const y = axisPos[idx + 1];
          axisPos[idx] = Math.sin(t * 4.0 + y * 0.03) * 14.0;
          axisPos[idx + 2] = Math.cos(t * 4.0 + y * 0.03) * 14.0;
        }
        centralAxis.material.opacity = 0.5;
      } else {
        for (let i = 0; i <= axisSegments; i++) {
          axisPos[i * 3] = 0;
          axisPos[i * 3 + 2] = 0;
        }
        centralAxis.material.opacity = 0.15 + Math.sin(t * 1.0) * 0.05;
      }
      centralAxis.geometry.attributes.position.needsUpdate = true;

      // ── テレメトリ / ステータスDOMを直接更新（再レンダー回避）──
      if (telemetryRef.current) {
        telemetryRef.current.innerHTML =
          ` EPISTEMIC MODE: OBSERVER_${mode}<br/>` +
          ` HORIZON RADIAL: ${current.radius.toFixed(1)}<br/>` +
          ` STRUCTURAL SEED: FIXED_0x731<br/>` +
          ` AMBIGUITY LEVEL: ${view.ambiguity}`;
      }
      if (statusRef.current) {
        statusRef.current.innerHTML = `<strong>${view.label}</strong><br/>${view.status}`;
      }

      renderer.clearDepth();
      renderer.render(trailScene, trailCamera);
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }
    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      layerSystems.forEach((sys) => {
        sys.points.geometry.dispose();
        sys.points.material.dispose();
      });
      axisGeometry.dispose();
      axisMaterial.dispose();
      trailQuad.geometry.dispose();
      trailMaterial.dispose();
      glowTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 30, boxSizing: 'border-box',
      }}>
        {/* ── ヘッダー ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 400, letterSpacing: 5, color: 'rgba(255,255,255,0.85)' }}>
              CMA COGNITIVE FIELD v5.1
            </h1>
            <p style={{ margin: '5px 0 0 0', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>
              Structural Ambiguity &amp; Epistemic Filter
            </p>
          </div>
          <div
            ref={telemetryRef}
            style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,180,0.6)', textAlign: 'right', lineHeight: 1.6, letterSpacing: 1 }}
          >
            EPISTEMIC MODE: INITIALIZING
          </div>
        </div>

        {/* ── フッター ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, alignItems: 'flex-start' }}>
          <div
            ref={statusRef}
            style={{
              fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.05)', padding: '6px 12px',
              borderLeft: '2px solid rgba(255,255,255,0.3)', pointerEvents: 'auto', maxWidth: 420,
            }}
          >
            SELECT COGNITIVE PERSPECTIVE...
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', pointerEvents: 'auto' }}>
            {MODE_ORDER.map((m) => (
              <button
                key={m}
                onClick={() => handleSelect(m)}
                style={{
                  background: currentMode === m ? 'rgba(0,255,180,0.08)' : 'rgba(255,255,255,0.03)',
                  border: currentMode === m ? '1px solid rgba(0,255,180,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  color: currentMode === m ? 'rgba(0,255,180,0.85)' : 'rgba(255,255,255,0.4)',
                  padding: '8px 14px', fontSize: 9, letterSpacing: 2, cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: currentMode === m ? '0 0 10px rgba(0,255,180,0.1)' : 'none',
                }}
              >
                {VIEW_MODES[m].label}
              </button>
            ))}

            {/* AUTO / MANUAL インジケータ — Invisible Witnessへの復帰状態を可視化 */}
            <span style={{
              fontSize: 8, letterSpacing: 2, padding: '4px 8px', marginLeft: 4,
              color: isAuto ? 'rgba(0,255,180,0.5)' : 'rgba(255,196,90,0.6)',
              border: `1px solid ${isAuto ? 'rgba(0,255,180,0.25)' : 'rgba(255,196,90,0.3)' }`,
            }}>
              {isAuto ? 'AUTO · WITNESS' : 'MANUAL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useControls, button, folder } from "leva";
import { pluginFile } from "./levafilepicker";

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement>() as any;
    const deskTextureRef = useRef<THREE.MeshStandardMaterial>() as any;
    const dataRef = useRef(null) as any;

    const desk = folder({
        width: { value: 40, min: 20, max: 100, step: 1 },
        height: { value: 20, min: 10, max: 50, step: 1 },
        deep: { value: 2, min: 0.2, max: 10, step: 0.1 },
        visible: true,
        color: { value: "#00fe93" },
        texture: folder({
            image: { image: undefined },
            repeat: { value: [1, 1], joystick: false },
        }),
    });

    const leg = folder({
        type: {
            options: {
                Round: 0,
                Square: 1,
            },
        },
        width: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
        height: { value: 10, min: 1, max: 20, step: 1 },
        visible: true,
        color: { value: "#964b00" },
        texture: folder({
            image: { image: undefined },
            repeat: { value: [1, 1], joystick: false },
        }),
    });

    const [deskControl, deskSet] = useControls(() => ({
        "Сountertop ": desk,
    }));
    const [legControl, legSet] = useControls(() => ({ "Table Legs": leg }));

    const onChange = (file: any) => {
        if (file) {
            // console.log(file.path);
            // fetch(file.path)
            //     .then((response) => response.json())
            //     .then((data) => console.log(data));
        }
    };
    useControls("Import Config", {
        File: pluginFile({ onChange }),
    });
    useControls("Export Config", {
        SNAPSHOT: button(() => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;

                canvas.toBlob(
                    (blob: any) => {
                        const a = document.createElement("a");
                        document.body.appendChild(a);
                        const url = window.URL.createObjectURL(blob);
                        a.href = url;
                        a.download = "desk";
                        a.click();
                    },
                    "image/png",
                    1.0
                );
            }
        }),
        NEWTABLE: button(() => {
            deskSet({
                width: 40,
                height: 20,
                deep: 2,
                visible: true,
                color: "#00fe93",
                image: undefined,
                repeat: [1, 1],
            });
            legSet({
                type: 0,
                width: 0.5,
                height: 10,
                visible: true,
                color: "#964b00",
                image: undefined,
                repeat: [1, 1],
            });
            deskTextureRef.current.needsUpdate = true;
        }),
        SAVE: button(() => {
            const data = dataRef.current;
            const element = document.createElement("a");
            const json = JSON.stringify(data);
            const blob = new Blob([json], { type: "application/json" });
            element.href = URL.createObjectURL(blob);
            element.download = "mydesk.json";
            document.body.appendChild(element);
            element.click();
        }),
    });

    useEffect(() => {
        dataRef.current = {
            deskControl,
            legControl,
        };
    }, [deskControl, legControl]);

    const deskTexture = deskControl.image
        ? new THREE.TextureLoader().load(deskControl.image)
        : null;

    const legTexture = legControl.image
        ? new THREE.TextureLoader().load(legControl.image)
        : null;

    useEffect(() => {
        if (deskTextureRef.current) {
            deskTextureRef.current.needsUpdate = true;
        }
    }, [deskControl.image]);

    const LegMesh = (value: any, index: number) => {
        const legTextureRef = useRef<THREE.MeshStandardMaterial>() as any;

        useEffect(() => {
            if (legTextureRef.current) {
                legTextureRef.current.needsUpdate = true;
            }
        }, [legControl.image]);

        return (
            <mesh
                key={index}
                position={
                    new THREE.Vector3(
                        Math.floor(index / 2)
                            ? deskControl.width / 2 - 2
                            : -(deskControl.width / 2 - 2),
                        legControl.height / 2,
                        index % 2
                            ? deskControl.height / 2 - 2
                            : -(deskControl.height / 2 - 2)
                    )
                }
                rotation={[0, Math.PI / 4, 0]}
            >
                <cylinderGeometry
                    args={[
                        legControl.width,
                        legControl.width,
                        legControl.height,
                        legControl.type ? 4 : 20,
                    ]}
                />
                <meshStandardMaterial
                    ref={legTextureRef}
                    color={legControl.color}
                    map={legTexture}
                />
            </mesh>
        );
    };

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
            }}
        >
            {/* <Dropzone
                onDrop={async (acceptedFiles: any) => {
                    const reader = new FileReader();
                    reader.onload = function (e: any) {
                        var contents = e.target.result;
                        console.log(contents);
                        // displayContents(contents);
                    };
                    reader.readAsDataURL(acceptedFiles);

                    // console.log(acceptedFiles[0].path);
                    // fetchJson(acceptedFiles[0].path);
                }}
            >
                {({ getRootProps, getInputProps }) => (
                    <section>
                        <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <p>
                                Drag 'n' drop some files here, or click to
                                select files
                            </p>
                        </div>
                    </section>
                )}
            </Dropzone> */}
            <Canvas
                gl={{ preserveDrawingBuffer: true }}
                ref={canvasRef}
                camera={{
                    near: 0.1,
                    far: 1000,
                    zoom: 1,
                    position: new THREE.Vector3(0, 20, 50),
                }}
                onCreated={({ gl }) => {
                    gl.setClearColor("#dddddd");
                }}
            >
                <Stats />
                <OrbitControls />
                <Suspense fallback={null}>
                    <gridHelper scale={new THREE.Vector3(5, 1, 5)} />
                    <ambientLight color={0xffffff44} />
                    <directionalLight
                        color={0xffffff33}
                        position={new THREE.Vector3(10, 10, 10)}
                        castShadow={true}
                    />
                    <mesh position={new THREE.Vector3(0, legControl.height, 0)}>
                        <boxBufferGeometry
                            args={[
                                deskControl.width,
                                deskControl.deep,
                                deskControl.height,
                            ]}
                        />
                        <meshStandardMaterial
                            ref={deskTextureRef}
                            color={deskControl.color}
                            map={deskTexture}
                        />
                    </mesh>
                    {Array.apply(null, Array(4)).map(
                        (value: any, index: number) => LegMesh(value, index)
                    )}
                </Suspense>
            </Canvas>
        </div>
    );
};

export default App;

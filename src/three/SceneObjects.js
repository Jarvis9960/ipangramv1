import React from "react";
import { useSceneStore } from "@/store/useSceneStore";
import { OBJECT_ORDER } from "@/config/objectMeta";

import HeroNetwork from "@/three/objects/HeroNetwork";
import NeuralCoreHub from "@/three/objects/NeuralCoreHub";
import CircuitBoard from "@/three/objects/CircuitBoard";
import FragmentedBlocks from "@/three/objects/FragmentedBlocks";
import CubeSystems from "@/three/objects/CubeSystems";
import GearCluster from "@/three/objects/GearCluster";
import DigitalAvatar from "@/three/objects/DigitalAvatar";
import WaveformOrb from "@/three/objects/WaveformOrb";
import BrainNetwork from "@/three/objects/BrainNetwork";
import IndustryCity from "@/three/objects/IndustryCity";
import OrbitalDashboard from "@/three/objects/OrbitalDashboard";
import ChessStrategy from "@/three/objects/ChessStrategy";

const COMPONENTS = [
  HeroNetwork,
  NeuralCoreHub,
  CircuitBoard,
  FragmentedBlocks,
  CubeSystems,
  GearCluster,
  DigitalAvatar,
  WaveformOrb,
  BrainNetwork,
  IndustryCity,
  OrbitalDashboard,
  ChessStrategy,
];

// Renders only the objects within a window around the active checkpoint
// (lazy reveal as the camera approaches). Window size scales with quality.
export default function SceneObjects() {
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const quality = useSceneStore((s) => s.qualityTier);
  const win = quality === "high" ? 3 : quality === "mid" ? 2 : 1;

  return (
    <>
      {COMPONENTS.map((Comp, i) => {
        if (Math.abs(i - activeIndex) > win) return null;
        return <Comp key={OBJECT_ORDER[i]} index={i} quality={quality} />;
      })}
    </>
  );
}

"use client";
import React from "react";
import { LampContainer } from "../ui/lamp";

export function LampDemo({
      children,
      }: {
      children?: React.ReactNode;
}) {
  return (
    <LampContainer className="bg-transparent">
      {children}
    </LampContainer>
  );
}

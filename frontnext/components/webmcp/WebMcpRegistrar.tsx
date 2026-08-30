"use client";

import { useEffect } from "react";
import { registerTools, toolNames } from "../../lib/webmcp/registerTools";
import { useLabStore } from "../../store/labStore";

/**
 * Registers the WebMCP tools once the page is mounted in the browser.
 *
 * Registration happens here and never at module load: `document` does not exist
 * during server rendering. If the browser exposes no WebMCP entry point the app
 * keeps working, and the status badge reports that it was not detected.
 */
export function WebMcpRegistrar() {
  const setWebmcpStatus = useLabStore((state) => state.setWebmcpStatus);

  useEffect(() => {
    const result = registerTools();

    setWebmcpStatus({
      detected: result.detected,
      toolCount: result.registered.length,
      checked: true,
    });

    return () => {
      result.unregister();
    };
  }, [setWebmcpStatus]);

  return null;
}

export { toolNames };

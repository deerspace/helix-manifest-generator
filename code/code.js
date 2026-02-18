// Helix Manifest Generator
// Run inside the published Helix design system file

// =============================
// HELIX MANIFEST LOADER
// =============================

const MANIFEST_URL =
  "https://raw.githubusercontent.com/deerspace/helix-manifest-generator/main/helix-manifest.json";

const MANIFEST_CACHE_KEY = "helix_manifest_cache";

async function loadManifest() {
  try {
    const response = await fetch(MANIFEST_URL);
    if (!response.ok) throw new Error("Network response failed");

    const manifest = await response.json();

    await figma.clientStorage.setAsync(MANIFEST_CACHE_KEY, manifest);

    console.log("Loaded manifest from network:", manifest.version);
    return manifest;
  } catch (error) {
    console.warn("Network fetch failed. Trying cache...");

    const cached = await figma.clientStorage.getAsync(MANIFEST_CACHE_KEY);

    if (cached) {
      console.log("Using cached manifest:", cached.version);
      return cached;
    }

    figma.notify("No manifest available.");
    throw new Error("Manifest unavailable");
  }
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function extractVariantProps(componentSet) {
  const props = componentSet.variantGroupProperties;
  if (!props) return [];
  return Object.keys(props);
}

function generateManifest() {
  const components = {};

  function scan(node) {
    if (node.type === "COMPONENT_SET") {
      const semanticName = normalizeName(node.name);

      components[semanticName] = {
        key: node.key,
        variantProps: extractVariantProps(node)
      };
    }

    if (node.type === "COMPONENT") {
      if (!node.parent || node.parent.type !== "COMPONENT_SET") {
        const semanticName = normalizeName(node.name);

        components[semanticName] = {
          key: node.key,
          variantProps: []
        };
      }
    }

    if ("children" in node) {
      for (const child of node.children) {
        scan(child);
      }
    }
  }

  for (const page of figma.root.children) {
    scan(page);
  }

  const manifest = {
    version: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    components
  };

  const json = JSON.stringify(manifest, null, 2);

  console.log("====== HELIX MANIFEST ======");
  console.log(json);
  console.log("====== END MANIFEST ======");

  figma.notify("Manifest generated. Check console.");
  figma.closePlugin();
}

if (figma.command === "generate") {
  generateManifest();
}
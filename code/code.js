// Helix Manifest Generator
// Run inside the published Helix design system file

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
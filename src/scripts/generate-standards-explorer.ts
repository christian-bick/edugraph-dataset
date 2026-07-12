import fs from 'fs';
import path from 'path';
import https from 'https';
import { IncomingMessage } from 'http';

const TEMP_DIR = path.resolve('./temp/common-core');
const STANDARDS_URL = 'https://huggingface.co/datasets/allenai/achieve-the-core/raw/main/standards.jsonl';
const DOMAINS_URL = 'https://huggingface.co/datasets/allenai/achieve-the-core/raw/main/domain_groups.json';

const STANDARDS_PATH = path.join(TEMP_DIR, 'standards.jsonl');
const DOMAINS_PATH = path.join(TEMP_DIR, 'domain_groups.json');

const PUBLIC_OUT_PATH = path.resolve('./public/standards-explorer.html');
const TEMP_OUT_PATH = path.join(TEMP_DIR, 'standards-explorer.html');

interface RawStandard {
  id: string;
  description: string;
  source: string;
  level: string;
  cluster_type?: string;
  aspects: string[];
  parent?: string;
  children: string[];
  connections: {
    'progress to'?: string[];
    'progress from'?: string[];
    related?: string[];
  };
  modeling: boolean;
}

// Download helper using node https
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response: IncomingMessage) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download file: status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Core parsing helper to find domain category from standard ID
function getDomainCat(id: string): string {
  const parts = id.split('.');
  const first = parts[0];
  if (first.startsWith('HS')) {
    return first.charAt(2) || ''; // conceptual categories e.g. HSN -> N, HSA -> A
  }
  if (/^[NAFGS]-/.test(first)) {
    return first.charAt(0); // High school code e.g. N-RN -> N, A-SSE -> A
  }
  return parts[1] || ''; // K-8 e.g. K.CC.A -> CC, 1.NBT.A -> NBT
}

function findDomainGroupName(domainCat: string, domainGroups: any): string {
  if (!domainCat) return 'Other';
  for (const [groupName, groupData] of Object.entries(domainGroups)) {
    const cats = (groupData as any).domain_cats || [];
    if (cats.includes(domainCat)) {
      return groupName;
    }
  }
  // Fallback prefix match
  for (const [groupName, groupData] of Object.entries(domainGroups)) {
    const cats = (groupData as any).domain_cats || [];
    for (const cat of cats) {
      if (domainCat.startsWith(cat) || cat.startsWith(domainCat)) {
        return groupName;
      }
    }
  }
  return 'Other';
}

function getGrade(id: string): string {
  const first = id.split('.')[0];
  if (first.startsWith('HS') || /^[NAFGS]-/.test(first)) return 'High School';
  if (first === 'K') return 'Kindergarten';
  if (/^[1-8]$/.test(first)) return `Grade ${first}`;
  return 'Other';
}

async function main() {
  try {
    // 1. Ensure directories exist
    if (!fs.existsSync(TEMP_DIR)) {
      console.log(`Creating directory: ${TEMP_DIR}`);
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // 2. Download missing files
    if (!fs.existsSync(STANDARDS_PATH)) {
      await downloadFile(STANDARDS_URL, STANDARDS_PATH);
    } else {
      console.log('standards.jsonl already exists. Skipping download.');
    }

    if (!fs.existsSync(DOMAINS_PATH)) {
      await downloadFile(DOMAINS_URL, DOMAINS_PATH);
    } else {
      console.log('domain_groups.json already exists. Skipping download.');
    }

    // 3. Read files
    console.log('Reading files...');
    const domainGroups = JSON.parse(fs.readFileSync(DOMAINS_PATH, 'utf-8'));
    const standardsLines = fs.readFileSync(STANDARDS_PATH, 'utf-8').split('\n');

    const standards: RawStandard[] = [];
    for (const line of standardsLines) {
      if (line.trim()) {
        standards.push(JSON.parse(line));
      }
    }

    console.log(`Parsed ${standards.length} standards.`);

    // 4. Build standard map and tree structure
    const standardMap: { [id: string]: RawStandard } = {};
    for (const std of standards) {
      standardMap[std.id] = std;
    }

    // Tree hierarchy structure
    // grades -> domainGroups -> domains -> clusters -> standards -> subStandards
    const tree: any = {};
    const gradeOrder = [
      'Kindergarten',
      'Grade 1',
      'Grade 2',
      'Grade 3',
      'Grade 4',
      'Grade 5',
      'Grade 6',
      'Grade 7',
      'Grade 8',
      'High School'
    ];

    for (const grade of gradeOrder) {
      tree[grade] = {};
      for (const groupName of Object.keys(domainGroups)) {
        tree[grade][groupName] = {
          description: domainGroups[groupName].description,
          domains: {}
        };
      }
      tree[grade]['Other'] = {
        description: 'Other concepts and miscellaneous standards.',
        domains: {}
      };
    }

    // Populate clusters and structure virtual domains
    const clusters = standards.filter(s => s.level.toLowerCase() === 'cluster');
    const standardsList = standards.filter(s => s.level.toLowerCase() === 'standard');
    const subStandards = standards.filter(s => s.level.toLowerCase() === 'sub-standard');

    // Create virtual domains first based on cluster parent fields
    const domains: { [id: string]: { id: string; name: string; grade: string; group: string; clusters: any[] } } = {};
    
    for (const cluster of clusters) {
      const parentDomainId = cluster.parent;
      if (!parentDomainId) continue;
      
      const grade = getGrade(cluster.id);
      const domainCat = getDomainCat(cluster.id);
      const groupName = findDomainGroupName(domainCat, domainGroups);

      if (!domains[parentDomainId]) {
        domains[parentDomainId] = {
          id: parentDomainId,
          name: `${parentDomainId} - ${groupName}`,
          grade,
          group: groupName,
          clusters: []
        };
      }
    }

    // Now organize clusters, standards, and sub-standards
    const clusterMap: { [id: string]: any } = {};
    for (const cluster of clusters) {
      clusterMap[cluster.id] = {
        id: cluster.id,
        description: cluster.description,
        cluster_type: cluster.cluster_type || 'major cluster',
        standards: []
      };
      
      const domainId = cluster.parent;
      if (domainId && domains[domainId]) {
        domains[domainId].clusters.push(clusterMap[cluster.id]);
      }
    }

    const standardUiMap: { [id: string]: any } = {};
    for (const std of standardsList) {
      standardUiMap[std.id] = {
        id: std.id,
        description: std.description,
        aspects: std.aspects,
        modeling: std.modeling,
        subStandards: []
      };

      const clusterId = std.parent;
      if (clusterId && clusterMap[clusterId]) {
        clusterMap[clusterId].standards.push(standardUiMap[std.id]);
      }
    }

    for (const sub of subStandards) {
      const parentStdId = sub.parent;
      if (parentStdId && standardUiMap[parentStdId]) {
        standardUiMap[parentStdId].subStandards.push({
          id: sub.id,
          description: sub.description,
          aspects: sub.aspects,
          modeling: sub.modeling
        });
      }
    }

    // Insert domains into our tree structure
    for (const domain of Object.values(domains)) {
      const { grade, group, id } = domain;
      if (tree[grade] && tree[grade][group]) {
        tree[grade][group].domains[id] = {
          id,
          name: domain.name,
          clusters: domain.clusters
        };
      }
    }

    // Clean up empty domain groups in tree
    for (const grade of Object.keys(tree)) {
      for (const groupName of Object.keys(tree[grade])) {
        if (Object.keys(tree[grade][groupName].domains).length === 0) {
          delete tree[grade][groupName];
        }
      }
    }

    // 5. Generate Standalone HTML File
    console.log('Generating HTML visualizer...');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Common Core Standards Explorer</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- D3.js for Connection Graph -->
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <style>
    /* Custom scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #1e293b;
    }
    ::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }
    .node-center {
      fill: #6366f1;
      stroke: #fff;
      stroke-width: 2px;
    }
    .node-prereq {
      fill: #10b981;
      stroke: #fff;
      stroke-width: 1.5px;
    }
    .node-next {
      fill: #3b82f6;
      stroke: #fff;
      stroke-width: 1.5px;
    }
    .node-related {
      fill: #eab308;
      stroke: #fff;
      stroke-width: 1.5px;
    }
    .link-prereq {
      stroke: #10b981;
      stroke-opacity: 0.6;
      stroke-width: 2px;
    }
    .link-next {
      stroke: #3b82f6;
      stroke-opacity: 0.6;
      stroke-width: 2px;
    }
    .link-related {
      stroke: #eab308;
      stroke-opacity: 0.6;
      stroke-dasharray: 4;
      stroke-width: 1.5px;
    }
    .arrow-prereq {
      fill: #10b981;
    }
    .arrow-next {
      fill: #3b82f6;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
    <div class="flex items-center gap-3">
      <div class="bg-indigo-600 p-2.5 rounded-lg text-white shadow-lg shadow-indigo-600/30">
        <i class="fa-solid fa-graduation-cap text-2xl"></i>
      </div>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-white">Common Core Standards Explorer</h1>
        <p class="text-xs text-slate-400">Structured interactive task list for mathematical pedagogical modeling</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-xs md:text-sm">
      <div class="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-md">
        <span class="text-slate-400 font-medium">Standards:</span>
        <span class="text-indigo-400 font-semibold ml-1" id="stat-standards">0</span>
      </div>
      <div class="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-md">
        <span class="text-slate-400 font-medium">Sub-standards:</span>
        <span class="text-emerald-400 font-semibold ml-1" id="stat-substandards">0</span>
      </div>
      <div class="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-md">
        <span class="text-slate-400 font-medium">Aspects Linked:</span>
        <span class="text-amber-400 font-semibold ml-1" id="stat-aspects">0</span>
      </div>
    </div>
  </header>

  <!-- Dashboard Workspace -->
  <div class="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden">
    
    <!-- Left Panel: Navigation & Filters -->
    <div class="w-full lg:w-96 bg-slate-900/50 border-r border-slate-800 flex flex-col min-h-0 shrink-0">
      
      <!-- Filters and Search -->
      <div class="p-4 border-b border-slate-800 flex flex-col gap-3">
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          <input type="text" id="search-input" placeholder="Search standard ID or description..." 
            class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors">
        </div>
        
        <!-- Filters Accordion Trigger -->
        <button onclick="toggleFilters()" class="text-xs text-slate-400 flex items-center justify-between hover:text-white transition-colors py-1">
          <span><i class="fa-solid fa-sliders mr-1.5"></i> Filter by Aspects & Modeling</span>
          <i id="filters-chevron" class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
        </button>
        
        <!-- Filter Options -->
        <div id="filter-options" class="hidden flex flex-col gap-2 pt-1 pb-2 border-t border-slate-800/40">
          <div class="text-xs text-slate-400 mb-1">Learning Aspects</div>
          <div class="flex flex-wrap gap-1.5">
            <button onclick="toggleAspectFilter('conceptual')" id="btn-filter-conceptual" class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Conceptual
            </button>
            <button onclick="toggleAspectFilter('procedural')" id="btn-filter-procedural" class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span> Procedural
            </button>
            <button onclick="toggleAspectFilter('application')" id="btn-filter-application" class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-purple-500"></span> Application
            </button>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="chk-filter-modeling" onchange="toggleModelingFilter()" class="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950">
            <label for="chk-filter-modeling" class="text-[11px] text-slate-400 hover:text-white cursor-pointer select-none">Requires Modeling Aspect</label>
          </div>
        </div>
      </div>

      <!-- Grade Navigation Tabs -->
      <div id="grade-tabs-container" class="grid grid-cols-2 gap-2 p-3 bg-slate-950 border-b border-slate-800 shrink-0">
        <!-- Grade tabs populated via JS -->
      </div>

      <!-- Accordion Tree Navigation -->
      <div id="tree-container" class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- Accordion nodes loaded dynamically -->
      </div>
    </div>

    <!-- Center Panel: Standards List & Search Results -->
    <div class="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-y-auto border-r border-slate-800 p-6">
      <div id="main-content-header" class="mb-4">
        <div class="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1" id="breadcrumbs">Select a cluster to explore</div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2" id="cluster-title">Common Core Math Standard Tasks</h2>
        <p class="text-sm text-slate-400 mt-1" id="cluster-desc">Choose a grade and domain on the left to review standard details, aspects, and prerequisite trees.</p>
      </div>

      <!-- Content Area -->
      <div id="standards-list" class="space-y-4">
        <!-- Highlighted standard lists are rendered here -->
      </div>
    </div>

    <!-- Right Panel: Metadata & Interactive Graph Visualization -->
    <div class="w-full lg:w-96 bg-slate-900/30 flex flex-col min-h-0 shrink-0">
      
      <!-- Selection Detail Card -->
      <div id="detail-card" class="p-6 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <span class="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono font-bold tracking-wider" id="detail-level">STANDARD</span>
          <span class="text-xs text-slate-500 font-mono" id="detail-id">K.CC.A.1</span>
        </div>
        <div>
          <h3 class="text-base font-semibold text-white leading-snug" id="detail-desc">Select a standard from the list to display details.</h3>
        </div>
        
        <!-- Metadata attributes -->
        <div class="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
          <div>
            <span class="text-slate-500 block mb-0.5">Aspects</span>
            <div id="detail-aspects" class="flex flex-wrap gap-1">
              <span class="text-slate-400 italic">None specified</span>
            </div>
          </div>
          <div>
            <span class="text-slate-500 block mb-0.5">Modeling</span>
            <span id="detail-modeling" class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">FALSE</span>
          </div>
        </div>
      </div>

      <!-- Connection Graph Panel -->
      <div class="flex-1 flex flex-col min-h-0 bg-slate-900/10">
        <div class="px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <span class="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-nodes text-slate-500"></i> Prerequisite & Connection Graph
          </span>
          <span class="text-[10px] text-slate-500">Click node to navigate</span>
        </div>
        
        <!-- SVG Container -->
        <div class="flex-1 min-h-[300px] relative overflow-hidden">
          <svg id="graph-svg" class="w-full h-full"></svg>
          <div id="graph-empty" class="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-950/20 text-xs">
            <i class="fa-solid fa-spinner fa-spin text-lg mb-2 text-slate-500 hidden" id="graph-spinner"></i>
            <span id="graph-empty-text">Select a standard with connections to display the graph</span>
          </div>
        </div>

        <!-- Graph Legend -->
        <div class="px-4 py-2 border-t border-slate-800 bg-slate-950/50 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 justify-center">
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#6366f1] border border-white/20"></span> Active</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-white/20"></span> Prerequisite</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-white/20"></span> Leads to</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#eab308] border border-white/20"></span> Related</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Embedded parsed standards data
    const STANDARDS_MAP = ${JSON.stringify(standardMap)};
    const GRADES_TREE = ${JSON.stringify(tree)};

    // UI state
    let activeGrade = 'Kindergarten';
    let activeDomainGroup = null;
    let activeDomain = null;
    let activeCluster = null;
    let activeStandardId = null;
    
    // Filters
    let searchFilter = '';
    let aspectFilters = { conceptual: false, procedural: false, application: false };
    let requireModeling = false;

    // Initialize Page
    window.addEventListener('DOMContentLoaded', () => {
      calculateStats();
      renderGradeTabs();
      loadGrade(activeGrade);
      
      // Setup search listeners
      const search = document.getElementById('search-input');
      search.addEventListener('input', (e) => {
        searchFilter = e.target.value.toLowerCase().trim();
        runSearch();
      });
    });

    function calculateStats() {
      let standardsCount = 0;
      let subStandardsCount = 0;
      let aspectsCount = 0;
      
      Object.values(STANDARDS_MAP).forEach(std => {
        if (std.level.toLowerCase() === 'standard') {
          standardsCount++;
        } else if (std.level.toLowerCase() === 'sub-standard') {
          subStandardsCount++;
        }
        if (std.aspects && std.aspects.length > 0) {
          aspectsCount += std.aspects.length;
        }
      });
      
      document.getElementById('stat-standards').textContent = standardsCount;
      document.getElementById('stat-substandards').textContent = subStandardsCount;
      document.getElementById('stat-aspects').textContent = aspectsCount;
    }

    // Toggle Filters panel
    function toggleFilters() {
      const opts = document.getElementById('filter-options');
      const chev = document.getElementById('filters-chevron');
      opts.classList.toggle('hidden');
      chev.classList.toggle('rotate-180');
    }

    function toggleAspectFilter(aspect) {
      aspectFilters[aspect] = !aspectFilters[aspect];
      const btn = document.getElementById('btn-filter-' + aspect);
      if (aspectFilters[aspect]) {
        btn.classList.remove('bg-slate-950', 'border-slate-800', 'text-slate-400');
        btn.classList.add('bg-indigo-600/20', 'border-indigo-500', 'text-white');
      } else {
        btn.classList.remove('bg-indigo-600/20', 'border-indigo-500', 'text-white');
        btn.classList.add('bg-slate-950', 'border-slate-800', 'text-slate-400');
      }
      runSearch();
    }

    // Toggle Modeling Filter
    function toggleModelingFilter() {
      requireModeling = document.getElementById('chk-filter-modeling').checked;
      runSearch();
    }

    // Render grid tabs for grades
    function renderGradeTabs() {
      const container = document.getElementById('grade-tabs-container');
      container.innerHTML = '';
      
      const grades = Object.keys(GRADES_TREE);
      grades.forEach(grade => {
        const btn = document.createElement('button');
        btn.textContent = grade;
        btn.className = \`px-2.5 py-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 border \${
          grade === activeGrade 
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/15 font-bold' 
            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
        }\`;
        btn.onclick = () => {
          activeGrade = grade;
          renderGradeTabs();
          loadGrade(grade);
        };
        container.appendChild(btn);
      });
    }

    // Load Accordion for Selected Grade
    function loadGrade(gradeName) {
      const container = document.getElementById('tree-container');
      container.innerHTML = '';
      
      const groups = GRADES_TREE[gradeName];
      if (!groups || Object.keys(groups).length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500 italic p-2">No standards for this grade.</div>';
        return;
      }

      Object.entries(groups).forEach(([groupName, groupData]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'border border-slate-800 rounded-lg bg-slate-900/30 overflow-hidden';
        
        // Group Header
        const header = document.createElement('button');
        header.className = 'w-full px-3 py-2 text-left font-semibold text-xs flex items-center justify-between hover:bg-slate-800/40 transition-colors';
        header.innerHTML = \`
          <span class="text-slate-200 leading-tight">\${groupName}</span>
          <i class="fa-solid fa-chevron-down text-[9px] text-slate-500 transition-transform duration-200"></i>
        \`;
        
        // Group Contents (Domains)
        const content = document.createElement('div');
        content.className = 'hidden border-t border-slate-800/60 p-2 space-y-1 bg-slate-950/40';
        
        // Add domains
        const domains = groupData.domains;
        Object.entries(domains).forEach(([domainId, domainData]) => {
          const domBtn = document.createElement('button');
          domBtn.className = 'w-full text-left px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/50 flex items-center gap-2 transition-colors';
          domBtn.innerHTML = \`<i class="fa-solid fa-folder text-indigo-400/80"></i> <span class="truncate">\${domainId}</span>\`;
          
          domBtn.onclick = () => {
            // Remove active style from other domain buttons
            content.querySelectorAll('button').forEach(b => b.classList.remove('bg-indigo-600/10', 'text-indigo-300', 'font-semibold'));
            domBtn.classList.add('bg-indigo-600/10', 'text-indigo-300', 'font-semibold');
            
            selectDomain(gradeName, groupName, domainId);
          };
          
          content.appendChild(domBtn);
        });

        header.onclick = () => {
          const isHidden = content.classList.contains('hidden');
          // Toggle open state
          content.classList.toggle('hidden');
          header.querySelector('i').classList.toggle('rotate-180');
        };

        groupEl.appendChild(header);
        groupEl.appendChild(content);
        container.appendChild(groupEl);
      });
      
      // Auto-open first group and select first domain
      const firstGroup = container.firstChild;
      if (firstGroup) {
        const btn = firstGroup.querySelector('button');
        const cont = firstGroup.querySelector('div');
        if (btn && cont) {
          btn.click();
          const firstDomBtn = cont.querySelector('button');
          if (firstDomBtn) firstDomBtn.click();
        }
      }
    }

    // Select Domain and load clusters
    function selectDomain(grade, groupName, domainId) {
      activeGrade = grade;
      activeDomainGroup = groupName;
      activeDomain = domainId;
      activeCluster = null;

      const domainData = GRADES_TREE[grade][groupName].domains[domainId];
      if (!domainData) return;

      const crumbs = document.getElementById('breadcrumbs');
      crumbs.textContent = \`\${grade} > \${groupName}\`;

      const title = document.getElementById('cluster-title');
      title.textContent = \`Domain: \${domainId}\`;

      const desc = document.getElementById('cluster-desc');
      desc.textContent = GRADES_TREE[grade][groupName].description;

      const listContainer = document.getElementById('standards-list');
      listContainer.innerHTML = '';

      // Load clusters in center panel
      if (!domainData.clusters || domainData.clusters.length === 0) {
        listContainer.innerHTML = '<div class="text-sm text-slate-500 italic">No clusters found under this domain.</div>';
        return;
      }

      domainData.clusters.forEach(cluster => {
        const clusterCard = document.createElement('div');
        clusterCard.className = 'bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm';
        
        // Cluster info
        clusterCard.innerHTML = \`
          <div class="flex items-start justify-between border-b border-slate-800/60 pb-3">
            <div>
              <span class="px-2 py-0.5 bg-slate-800 border border-slate-700/60 text-slate-400 rounded text-[9px] font-mono tracking-wider">CLUSTER</span>
              <h3 class="text-sm font-semibold text-slate-200 mt-1.5 leading-snug">\${cluster.id}: \${cluster.description}</h3>
            </div>
            <span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold \${
              cluster.cluster_type.includes('major') 
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                : 'bg-slate-800 text-slate-500'
            }">\${cluster.cluster_type}</span>
          </div>
        \`;

        // Standards list
        const stdContainer = document.createElement('div');
        stdContainer.className = 'space-y-3';

        if (!cluster.standards || cluster.standards.length === 0) {
          stdContainer.innerHTML = '<div class="text-xs text-slate-500 italic pl-2">No standards in this cluster.</div>';
        } else {
          cluster.standards.forEach(std => {
            // Apply filtering logic here if any is active
            if (!matchesFilters(std)) return;

            const stdEl = document.createElement('div');
            stdEl.id = \`card-\${std.id.replace(/\\./g, '_')}\`;
            stdEl.className = \`p-3.5 border rounded-lg bg-slate-950/60 hover:bg-slate-900/60 transition-all duration-150 cursor-pointer flex flex-col gap-2.5 \${
              activeStandardId === std.id ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/60 hover:border-slate-700'
            }\`;
            
            // Build aspect badges
            let aspectBadges = '';
            std.aspects.forEach(asp => {
              let color = 'bg-slate-800 text-slate-400';
              if (asp.toLowerCase().includes('conceptual')) color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              else if (asp.toLowerCase().includes('procedural')) color = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
              else if (asp.toLowerCase().includes('application')) color = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
              
              aspectBadges += \`<span class="px-2 py-0.5 rounded text-[9px] leading-none font-semibold \${color}">\${asp}</span>\`;
            });

            if (std.modeling) {
              aspectBadges += \`<span class="px-2 py-0.5 rounded text-[9px] leading-none font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><i class="fa-solid fa-cubes mr-0.5"></i> Modeling</span>\`;
            }

            stdEl.innerHTML = \`
              <div class="flex items-start justify-between gap-3">
                <span class="text-xs font-mono font-bold text-slate-300">\${std.id}</span>
                <div class="flex items-center gap-1 shrink-0">\${aspectBadges}</div>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">\${std.description}</p>
            \`;

            // Append sub-standards if present
            if (std.subStandards && std.subStandards.length > 0) {
              const subsList = document.createElement('div');
              subsList.className = 'border-t border-slate-800/40 pt-2.5 mt-1 space-y-2';
              std.subStandards.forEach(sub => {
                let subBadges = '';
                sub.aspects.forEach(asp => {
                  let color = 'bg-slate-800 text-slate-400';
                  if (asp.toLowerCase().includes('conceptual')) color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  else if (asp.toLowerCase().includes('procedural')) color = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                  else if (asp.toLowerCase().includes('application')) color = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                  subBadges += \`<span class="px-1.5 py-0.5 rounded text-[8px] font-semibold \${color}">\${asp}</span>\`;
                });

                subsList.innerHTML += \`
                  <div class="pl-4 border-l-2 border-slate-800 flex flex-col gap-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-mono font-semibold text-slate-400">\${sub.id}</span>
                      <div class="flex gap-1">\${subBadges}</div>
                    </div>
                    <p class="text-[11px] text-slate-400 leading-normal">\${sub.description}</p>
                  </div>
                \`;
              });
              stdEl.appendChild(subsList);
            }

            stdEl.onclick = (e) => {
              e.stopPropagation();
              selectStandard(std.id);
            };

            stdContainer.appendChild(stdEl);
          });
        }

        clusterCard.appendChild(stdContainer);
        // Only append cluster cards that have visible children (or if not filtering standard elements)
        if (stdContainer.children.length > 0) {
          listContainer.appendChild(clusterCard);
        }
      });

      if (listContainer.children.length === 0) {
        listContainer.innerHTML = '<div class="text-sm text-slate-500 italic text-center py-6">No standards match the current filters.</div>';
      }
    }

    function matchesFilters(std) {
      if (requireModeling && !std.modeling) return false;
      
      const hasConceptual = aspectFilters.conceptual && std.aspects.some(a => a.toLowerCase().includes('conceptual'));
      const hasProcedural = aspectFilters.procedural && std.aspects.some(a => a.toLowerCase().includes('procedural'));
      const hasApplication = aspectFilters.application && std.aspects.some(a => a.toLowerCase().includes('application'));
      
      // If any aspect filter is active, standard must match at least one of the active ones
      const isAnyAspectFilterActive = aspectFilters.conceptual || aspectFilters.procedural || aspectFilters.application;
      if (isAnyAspectFilterActive && !(hasConceptual || hasProcedural || hasApplication)) {
        return false;
      }
      
      return true;
    }

    // Select standard and render detail card + connection graph
    function selectStandard(stdId) {
      activeStandardId = stdId;
      const std = STANDARDS_MAP[stdId];
      if (!std) return;

      // Update styling in center list
      document.querySelectorAll('#standards-list > div > div > div[id^="card-"]').forEach(el => {
        el.classList.remove('border-indigo-500', 'ring-1', 'ring-indigo-500/50', 'bg-indigo-500/5');
        el.classList.add('border-slate-800/60', 'hover:border-slate-700');
      });

      const safeId = stdId.replace(/\./g, '_');
      const activeCard = document.getElementById('card-' + safeId);
      if (activeCard) {
        activeCard.classList.remove('border-slate-800/60', 'hover:border-slate-700');
        activeCard.classList.add('border-indigo-500', 'ring-1', 'ring-indigo-500/50', 'bg-indigo-500/5');
      }

      // Update right details panel
      document.getElementById('detail-level').textContent = std.level.toUpperCase();
      document.getElementById('detail-id').textContent = std.id;
      document.getElementById('detail-desc').textContent = std.description;
      
      const aspectsDiv = document.getElementById('detail-aspects');
      aspectsDiv.innerHTML = '';
      if (std.aspects && std.aspects.length > 0) {
        std.aspects.forEach(asp => {
          const badge = document.createElement('span');
          badge.className = 'px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20';
          badge.textContent = asp;
          aspectsDiv.appendChild(badge);
        });
      } else {
        aspectsDiv.innerHTML = '<span class="text-slate-500 italic">None specified</span>';
      }

      const modSpan = document.getElementById('detail-modeling');
      if (std.modeling) {
        modSpan.textContent = 'TRUE';
        modSpan.className = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/20';
      } else {
        modSpan.textContent = 'FALSE';
        modSpan.className = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500';
      }

      // Update Prerequisite Tree Graph
      updateGraph(stdId);
    }

    // Search and display results
    function runSearch() {
      if (!searchFilter && !aspectFilters.conceptual && !aspectFilters.procedural && !aspectFilters.application && !requireModeling) {
        // Reset to original selected domain
        if (activeDomain) {
          selectDomain(activeGrade, activeDomainGroup, activeDomain);
        } else {
          loadGrade(activeGrade);
        }
        return;
      }

      const listContainer = document.getElementById('standards-list');
      listContainer.innerHTML = '';

      const crumbs = document.getElementById('breadcrumbs');
      crumbs.textContent = 'SEARCH RESULTS';

      const title = document.getElementById('cluster-title');
      title.textContent = \`Filtered Search Results\`;

      const desc = document.getElementById('cluster-desc');
      desc.textContent = 'Showing standards matching your query and filter parameters.';

      // Search over standardList and sub-standards
      const matches = Object.values(STANDARDS_MAP).filter(std => {
        if (std.level.toLowerCase() !== 'standard') return false;
        
        // Search filter
        if (searchFilter) {
          const inId = std.id.toLowerCase().includes(searchFilter);
          const inDesc = std.description.toLowerCase().includes(searchFilter);
          if (!inId && !inDesc) return false;
        }

        // Checklist filters
        return matchesFilters(std);
      });

      if (matches.length === 0) {
        listContainer.innerHTML = '<div class="text-sm text-slate-500 italic text-center py-10">No matching standards found. Try broadening your criteria.</div>';
        return;
      }

      const groupCard = document.createElement('div');
      groupCard.className = 'bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm';
      
      const stdContainer = document.createElement('div');
      stdContainer.className = 'space-y-3';

      matches.forEach(std => {
        const stdEl = document.createElement('div');
        stdEl.id = \`card-\${std.id.replace(/\\./g, '_')}\`;
        stdEl.className = \`p-3.5 border rounded-lg bg-slate-950/60 hover:bg-slate-900/60 transition-all duration-150 cursor-pointer flex flex-col gap-2.5 \${
          activeStandardId === std.id ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/60 hover:border-slate-700'
        }\`;
        
        let aspectBadges = '';
        std.aspects.forEach(asp => {
          let color = 'bg-slate-800 text-slate-400';
          if (asp.toLowerCase().includes('conceptual')) color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          else if (asp.toLowerCase().includes('procedural')) color = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
          else if (asp.toLowerCase().includes('application')) color = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
          aspectBadges += \`<span class="px-2 py-0.5 rounded text-[9px] leading-none font-semibold \${color}">\${asp}</span>\`;
        });

        if (std.modeling) {
          aspectBadges += \`<span class="px-2 py-0.5 rounded text-[9px] leading-none font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><i class="fa-solid fa-cubes mr-0.5"></i> Modeling</span>\`;
        }

        stdEl.innerHTML = \`
          <div class="flex items-start justify-between gap-3">
            <span class="text-xs font-mono font-bold text-slate-300">\${std.id}</span>
            <div class="flex items-center gap-1 shrink-0">\${aspectBadges}</div>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">\${std.description}</p>
        \`;

        stdEl.onclick = (e) => {
          e.stopPropagation();
          selectStandard(std.id);
        };

        stdContainer.appendChild(stdEl);
      });

      groupCard.appendChild(stdContainer);
      listContainer.appendChild(groupCard);
    }

    // D3.js Connections Graph Rendering
    function updateGraph(centerId) {
      const centerNode = STANDARDS_MAP[centerId];
      const svg = d3.select("#graph-svg");
      const emptyEl = document.getElementById('graph-empty');
      const emptyText = document.getElementById('graph-empty-text');

      // Clear previous drawing
      svg.selectAll("*").remove();

      if (!centerNode) {
        emptyEl.style.display = 'flex';
        emptyText.textContent = 'Select a standard with connections to display the graph';
        return;
      }

      const conns = centerNode.connections || {};
      const prereqs = conns['progress from'] || [];
      const nextsteps = conns['progress to'] || [];
      const related = conns['related'] || [];

      if (prereqs.length === 0 && nextsteps.length === 0 && related.length === 0) {
        emptyEl.style.display = 'flex';
        emptyText.textContent = \`No registered prerequisites or next steps for \${centerId}.\`;
        return;
      }

      emptyEl.style.display = 'none';

      const width = svg.node().clientWidth || 400;
      const height = svg.node().clientHeight || 350;

      // Define standard layout sizes
      const nodes = [{ id: centerId, label: centerId, type: 'center', description: centerNode.description }];
      const links = [];

      prereqs.forEach(src => {
        if (!nodes.find(n => n.id === src)) {
          nodes.push({ id: src, label: src, type: 'prereq', description: STANDARDS_MAP[src]?.description || 'No description available' });
        }
        links.push({ source: src, target: centerId, relation: 'prereq' });
      });

      nextsteps.forEach(tgt => {
        if (!nodes.find(n => n.id === tgt)) {
          nodes.push({ id: tgt, label: tgt, type: 'next', description: STANDARDS_MAP[tgt]?.description || 'No description available' });
        }
        links.push({ source: centerId, target: tgt, relation: 'next' });
      });

      related.forEach(rel => {
        if (!nodes.find(n => n.id === rel)) {
          nodes.push({ id: rel, label: rel, type: 'related', description: STANDARDS_MAP[rel]?.description || 'No description available' });
        }
        links.push({ source: centerId, target: rel, relation: 'related' });
      });

      // Markers (Arrows) for directional lines
      svg.append("defs").selectAll("marker")
        .data(["prereq", "next"])
        .enter().append("marker")
        .attr("id", d => \`arrow-\${d}\`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class", d => \`arrow-\${d}\`);

      // Simulation setup
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(110))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(40));

      // Draw links
      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", d => \`link-\${d.relation}\`)
        .attr("marker-end", d => {
          if (d.relation === 'prereq' || d.relation === 'next') return \`url(#arrow-\${d.relation})\`;
          return null;
        });

      // Draw nodes
      const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .on("click", (event, d) => {
          if (d.id !== centerId) {
            // Find grade of standard
            const targetGrade = getGradeFromId(d.id);
            if (targetGrade !== activeGrade) {
              activeGrade = targetGrade;
              renderGradeTabs();
              loadGrade(targetGrade);
            }
            selectStandard(d.id);
            // Highlight inside standard lists if searchable or visible
            const cardEl = document.getElementById(\`card-\${d.id.replace(/\\./g, '_')}\`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });

      // Node circles
      node.append("circle")
        .attr("r", 20)
        .attr("class", d => \`node-\${d.type} cursor-pointer transition-all hover:scale-110\` + 
          (d.id === centerId ? ' ring-4 ring-indigo-500/30' : '')
        );

      // Node labels
      node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("class", "text-[9px] font-mono font-bold fill-white select-none pointer-events-none")
        .text(d => {
          return d.label.split('.').slice(-2).join('.');
        });

      // Simple Tooltip on Hover
      node.append("title")
        .text(d => \`\${d.id}\\n\${d.description}\`);

      // Simulation ticks
      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("transform", d => \`translate(\${Math.max(20, Math.min(width - 20, d.x))},\${Math.max(20, Math.min(height - 20, d.y))})\`);
      });

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }

    function getGradeFromId(id) {
      const first = id.split('.')[0];
      if (first.startsWith('HS') || /^[NAFGS]-/.test(first)) return 'High School';
      if (first === 'K') return 'Kindergarten';
      if (/^[1-8]$/.test(first)) return 'Grade ' + first;
      return 'Other';
    }
  </script>
</body>
</html>
`;

    // 6. Write out output files
    fs.writeFileSync(TEMP_OUT_PATH, htmlContent, 'utf-8');
    console.log(`Generated self-contained HTML page: ${TEMP_OUT_PATH}`);

    // Copy to public directory for local Vite serving
    const publicDir = path.dirname(PUBLIC_OUT_PATH);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(PUBLIC_OUT_PATH, htmlContent, 'utf-8');
    console.log(`Copied HTML page to dev public server: ${PUBLIC_OUT_PATH}`);

    console.log('Successfully completed generate-standards-explorer execution!');
  } catch (error) {
    console.error('Error generating Standards Explorer:', error);
    process.exit(1);
  }
}

main();

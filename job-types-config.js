// EMG Energy - Job Types Configuration
// Defines survey types and their checklists

var JOB_TYPES = {
    'ber-assessment': {
        name: 'BER Rating Assessment',
        description: 'Full Building Energy Rating assessment per DEAP methodology',
        icon: '🏠',
        checklist: [
            {
                id: 'building-fabric',
                category: 'Building Fabric',
                items: [
                    { id: 'walls-external', name: 'External wall construction and U-value', keywords: ['wall', 'cavity', 'solid', 'insulation', 'brick', 'block', 'external'] },
                    { id: 'walls-internal', name: 'Internal wall partitions', keywords: ['internal wall', 'partition', 'dividing wall'] },
                    { id: 'roof-construction', name: 'Roof construction and insulation', keywords: ['roof', 'attic', 'loft', 'insulation', 'tiles', 'felt', 'sarking'] },
                    { id: 'floor-construction', name: 'Floor construction and insulation', keywords: ['floor', 'ground floor', 'suspended', 'concrete', 'timber'] },
                    { id: 'windows-glazing', name: 'Windows and glazing type', keywords: ['window', 'glazing', 'double', 'single', 'triple', 'pvc', 'timber'] },
                    { id: 'doors-external', name: 'External doors and glazing', keywords: ['door', 'front door', 'back door', 'external door', 'patio door'] },
                    { id: 'thermal-bridging', name: 'Thermal bridging assessment', keywords: ['thermal bridge', 'cold bridge', 'junction', 'cold spot'] }
                ]
            },
            {
                id: 'heating-systems',
                category: 'Heating Systems',
                items: [
                    { id: 'boiler-type', name: 'Main heating boiler type and age', keywords: ['boiler', 'furnace', 'heater', 'condensing', 'combi', 'gas', 'oil'] },
                    { id: 'radiators', name: 'Radiator count and sizing', keywords: ['radiator', 'rad', 'heating panel'] },
                    { id: 'heating-controls', name: 'Heating controls and thermostats', keywords: ['thermostat', 'control', 'timer', 'programmer', 'TRV'] },
                    { id: 'hot-water', name: 'Hot water system and cylinder', keywords: ['hot water', 'cylinder', 'immersion', 'tank', 'storage'] },
                    { id: 'distribution', name: 'Heat distribution system', keywords: ['pipes', 'distribution', 'pump', 'zone', 'circuit'] }
                ]
            },
            {
                id: 'ventilation',
                category: 'Ventilation',
                items: [
                    { id: 'ventilation-type', name: 'Ventilation system type', keywords: ['ventilation', 'air', 'vent', 'extract', 'supply', 'MVHR', 'MEV'] },
                    { id: 'air-tightness', name: 'Air tightness and draught proofing', keywords: ['draught', 'draft', 'air tight', 'sealed', 'gaps', 'leaks'] },
                    { id: 'extractor-fans', name: 'Extractor fans and location', keywords: ['extractor', 'fan', 'exhaust', 'bathroom fan', 'kitchen fan'] }
                ]
            },
            {
                id: 'renewable-energy',
                category: 'Renewable Energy',
                items: [
                    { id: 'solar-pv', name: 'Solar PV panels', keywords: ['solar', 'PV', 'photovoltaic', 'panels', 'solar panels'] },
                    { id: 'solar-thermal', name: 'Solar thermal panels', keywords: ['solar thermal', 'solar water', 'evacuated tube'] },
                    { id: 'heat-pump', name: 'Heat pump system', keywords: ['heat pump', 'air source', 'ground source', 'ASHP', 'GSHP'] },
                    { id: 'biomass', name: 'Biomass heating', keywords: ['biomass', 'wood', 'pellet', 'stove'] }
                ]
            },
            {
                id: 'property-details',
                category: 'Property Details',
                items: [
                    { id: 'property-type', name: 'Property type and age', keywords: ['house', 'apartment', 'bungalow', 'detached', 'semi', 'terraced', 'built', 'age'] },
                    { id: 'floor-area', name: 'Floor area measurements', keywords: ['area', 'square metre', 'sqm', 'size', 'dimensions'] },
                    { id: 'room-layout', name: 'Room layout and usage', keywords: ['bedroom', 'living', 'kitchen', 'bathroom', 'room', 'layout'] },
                    { id: 'orientation', name: 'Building orientation', keywords: ['north', 'south', 'east', 'west', 'facing', 'orientation'] }
                ]
            }
        ]
    },

    'attic-insulation': {
        name: 'Attic Insulation Survey',
        description: 'Assessment of attic/roof space insulation compliance',
        icon: '🏚️',
        checklist: [
            {
                id: 'attic-access',
                category: 'Access & Structure',
                items: [
                    { id: 'attic-access', name: 'Attic access location and type', keywords: ['access', 'hatch', 'attic door', 'loft hatch'] },
                    { id: 'structural-integrity', name: 'Roof structure integrity', keywords: ['structure', 'timber', 'truss', 'rafter', 'damage', 'rot'] },
                    { id: 'ventilation-attic', name: 'Attic ventilation', keywords: ['ventilation', 'vent', 'soffit', 'ridge', 'air flow'] }
                ]
            },
            {
                id: 'insulation-current',
                category: 'Current Insulation',
                items: [
                    { id: 'insulation-type', name: 'Insulation material type', keywords: ['insulation', 'mineral wool', 'fibreglass', 'cellulose', 'foam'] },
                    { id: 'insulation-depth', name: 'Insulation depth/thickness', keywords: ['depth', 'thickness', 'mm', 'millimetre', 'layer'] },
                    { id: 'insulation-condition', name: 'Insulation condition', keywords: ['condition', 'compressed', 'damaged', 'wet', 'mold', 'settling'] },
                    { id: 'coverage', name: 'Coverage and gaps', keywords: ['coverage', 'gap', 'missing', 'patchy', 'complete'] }
                ]
            },
            {
                id: 'compliance',
                category: 'Compliance Assessment',
                items: [
                    { id: 'u-value', name: 'U-value calculation', keywords: ['u-value', 'thermal', 'resistance', 'R-value'] },
                    { id: 'part-l', name: 'Part L compliance check', keywords: ['part l', 'compliance', 'regulation', 'building reg'] },
                    { id: 'recommendations', name: 'Upgrade recommendations', keywords: ['recommend', 'upgrade', 'improve', 'add', 'top up'] }
                ]
            }
        ]
    },

    'heating-system': {
        name: 'Heating System Assessment',
        description: 'Comprehensive heating system efficiency and compliance assessment',
        icon: '🔥',
        checklist: [
            {
                id: 'boiler-assessment',
                category: 'Boiler/Heat Source',
                items: [
                    { id: 'boiler-make-model', name: 'Boiler make, model and age', keywords: ['boiler', 'make', 'model', 'brand', 'age', 'installed'] },
                    { id: 'boiler-type', name: 'Boiler type and fuel', keywords: ['gas', 'oil', 'condensing', 'combi', 'system', 'regular'] },
                    { id: 'boiler-efficiency', name: 'Efficiency rating', keywords: ['efficiency', 'rating', 'SEDBUK', 'percentage'] },
                    { id: 'boiler-condition', name: 'Physical condition', keywords: ['condition', 'rust', 'corrosion', 'leaks', 'noise'] },
                    { id: 'servicing', name: 'Service history', keywords: ['service', 'maintenance', 'serviced', 'last service'] }
                ]
            },
            {
                id: 'distribution',
                category: 'Distribution System',
                items: [
                    { id: 'radiators-count', name: 'Radiator count and sizing', keywords: ['radiator', 'count', 'number', 'size'] },
                    { id: 'radiator-condition', name: 'Radiator condition', keywords: ['radiator', 'condition', 'cold spots', 'air', 'bleed'] },
                    { id: 'pipework', name: 'Pipework and insulation', keywords: ['pipes', 'pipework', 'insulated', 'lagging'] },
                    { id: 'pump', name: 'Circulation pump', keywords: ['pump', 'circulation', 'circulator'] }
                ]
            },
            {
                id: 'controls',
                category: 'Controls & Efficiency',
                items: [
                    { id: 'thermostat', name: 'Room thermostat', keywords: ['thermostat', 'room stat', 'temperature control'] },
                    { id: 'programmer', name: 'Heating programmer/timer', keywords: ['programmer', 'timer', 'schedule', 'time clock'] },
                    { id: 'trv', name: 'TRV (Thermostatic Radiator Valves)', keywords: ['TRV', 'thermostatic valve', 'radiator valve'] },
                    { id: 'zone-control', name: 'Zone controls', keywords: ['zone', 'zoning', 'zone valve', 'multi-zone'] }
                ]
            }
        ]
    },

    'ventilation-survey': {
        name: 'Ventilation System Survey',
        description: 'Assessment of ventilation systems and indoor air quality',
        icon: '💨',
        checklist: [
            {
                id: 'system-type',
                category: 'Ventilation System',
                items: [
                    { id: 'ventilation-system', name: 'Ventilation system type', keywords: ['MVHR', 'MEV', 'natural', 'mechanical', 'ventilation system'] },
                    { id: 'ductwork', name: 'Ductwork condition', keywords: ['duct', 'ductwork', 'ducting', 'air duct'] },
                    { id: 'filters', name: 'Filter condition and type', keywords: ['filter', 'filtration', 'air filter'] }
                ]
            },
            {
                id: 'extraction',
                category: 'Extract Ventilation',
                items: [
                    { id: 'kitchen-extract', name: 'Kitchen extraction', keywords: ['kitchen', 'extract', 'cooker hood', 'kitchen fan'] },
                    { id: 'bathroom-extract', name: 'Bathroom extraction', keywords: ['bathroom', 'extract', 'bathroom fan', 'humidity'] },
                    { id: 'utility-extract', name: 'Utility room extraction', keywords: ['utility', 'extract', 'utility fan'] }
                ]
            }
        ]
    }
};

// Initialize default job types in localStorage
function initializeJobTypes() {
    var existing = localStorage.getItem('emg_job_types');
    if (!existing) {
        localStorage.setItem('emg_job_types', JSON.stringify(JOB_TYPES));
        console.log('✅ Initialized default job types');
    }
}

// Get all job types
function getJobTypes() {
    var data = localStorage.getItem('emg_job_types');
    return data ? JSON.parse(data) : JOB_TYPES;
}

// Get specific job type
function getJobType(typeId) {
    var types = getJobTypes();
    return types[typeId] || null;
}

// Save job types
function saveJobTypes(types) {
    localStorage.setItem('emg_job_types', JSON.stringify(types));
}

// Initialize on load
if (typeof window !== 'undefined') {
    initializeJobTypes();
}

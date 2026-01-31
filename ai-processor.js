// EMG Energy - AI Survey Processor
// Simulates AI analysis of voice notes, images, and text
// In production: Would use OpenAI GPT-4, Whisper, Vision APIs

var AI_PROCESSOR = {

    // Analyze voice note text and match to checklist items
    analyzeVoiceNote: function(noteText, jobType) {
        console.log('[AI] Analyzing voice note:', noteText.substring(0, 50) + '...');

        var matches = [];
        var text = noteText.toLowerCase();

        if (!jobType || !jobType.checklist) {
            return matches;
        }

        // Scan all checklist categories and items
        for (var i = 0; i < jobType.checklist.length; i++) {
            var category = jobType.checklist[i];
            for (var j = 0; j < category.items.length; j++) {
                var item = category.items[j];

                // Check if any keywords match
                var matched = false;
                for (var k = 0; k < item.keywords.length; k++) {
                    if (text.indexOf(item.keywords[k]) !== -1) {
                        matched = true;
                        break;
                    }
                }

                if (matched) {
                    matches.push({
                        categoryId: category.id,
                        categoryName: category.category,
                        itemId: item.id,
                        itemName: item.name,
                        confidence: this.calculateConfidence(text, item.keywords)
                    });
                }
            }
        }

        console.log('[AI] Found', matches.length, 'checklist matches');
        return matches;
    },

    // Calculate confidence score based on keyword matches
    calculateConfidence: function(text, keywords) {
        var matches = 0;
        var total = keywords.length;

        for (var i = 0; i < keywords.length; i++) {
            if (text.toLowerCase().indexOf(keywords[i]) !== -1) {
                matches++;
            }
        }

        var confidence = Math.min(95, 60 + (matches / total * 35));
        return Math.round(confidence);
    },

    // Analyze all voice notes for a project
    analyzeProject: function(project) {
        console.log('[AI] Analyzing project:', project.projectReference);

        var jobType = getJobType(project.jobTypeId);
        if (!jobType) {
            console.log('[AI] No job type found');
            return { checkedItems: [], suggestions: [] };
        }

        var checkedItems = {};
        var allText = '';

        // Combine all voice notes
        if (project.voiceNotes && project.voiceNotes.length > 0) {
            for (var i = 0; i < project.voiceNotes.length; i++) {
                var note = project.voiceNotes[i];
                allText += ' ' + note.transcription;

                // Analyze each note
                var matches = this.analyzeVoiceNote(note.transcription, jobType);

                // Mark items as checked
                for (var j = 0; j < matches.length; j++) {
                    var key = matches[j].itemId;
                    if (!checkedItems[key]) {
                        checkedItems[key] = {
                            checked: true,
                            confidence: matches[j].confidence,
                            source: 'voice',
                            noteIndex: i
                        };
                    } else {
                        // Update confidence if higher
                        if (matches[j].confidence > checkedItems[key].confidence) {
                            checkedItems[key].confidence = matches[j].confidence;
                        }
                    }
                }
            }
        }

        // Generate suggestions for missing items
        var suggestions = this.generateSuggestions(jobType, checkedItems);

        console.log('[AI] Analysis complete:', Object.keys(checkedItems).length, 'items checked');
        console.log('[AI] Generated', suggestions.length, 'suggestions');

        return {
            checkedItems: checkedItems,
            suggestions: suggestions,
            completionPercentage: this.calculateCompletion(jobType, checkedItems)
        };
    },

    // Generate suggestions for missing checklist items
    generateSuggestions: function(jobType, checkedItems) {
        var suggestions = [];

        if (!jobType || !jobType.checklist) return suggestions;

        for (var i = 0; i < jobType.checklist.length; i++) {
            var category = jobType.checklist[i];
            var categoryMissing = [];

            for (var j = 0; j < category.items.length; j++) {
                var item = category.items[j];
                if (!checkedItems[item.id]) {
                    categoryMissing.push(item.name);
                }
            }

            if (categoryMissing.length > 0) {
                suggestions.push({
                    category: category.category,
                    priority: this.getSuggestionPriority(category.id),
                    items: categoryMissing,
                    message: 'The following items in "' + category.category + '" have not been addressed:'
                });
            }
        }

        return suggestions;
    },

    // Get priority level for suggestions
    getSuggestionPriority: function(categoryId) {
        var highPriority = ['building-fabric', 'heating-systems', 'property-details', 'boiler-assessment'];
        var mediumPriority = ['ventilation', 'distribution', 'controls', 'attic-access'];

        if (highPriority.indexOf(categoryId) !== -1) return 'high';
        if (mediumPriority.indexOf(categoryId) !== -1) return 'medium';
        return 'low';
    },

    // Calculate completion percentage
    calculateCompletion: function(jobType, checkedItems) {
        if (!jobType || !jobType.checklist) return 0;

        var totalItems = 0;
        var checkedCount = Object.keys(checkedItems).length;

        for (var i = 0; i < jobType.checklist.length; i++) {
            totalItems += jobType.checklist[i].items.length;
        }

        if (totalItems === 0) return 0;

        return Math.round((checkedCount / totalItems) * 100);
    },

    // Generate professional report text from voice notes
    draftProfessionalText: function(voiceNotes, jobType) {
        console.log('[AI] Drafting professional text from', voiceNotes.length, 'notes');

        // Group notes by detected category
        var categorized = this.categorizeNotes(voiceNotes, jobType);

        var professionalText = '';

        for (var category in categorized) {
            if (categorized.hasOwnProperty(category)) {
                professionalText += '\n\n' + category + ':\n';
                for (var i = 0; i < categorized[category].length; i++) {
                    professionalText += '• ' + this.professionalize(categorized[category][i]) + '\n';
                }
            }
        }

        return professionalText;
    },

    // Categorize notes by detected content
    categorizeNotes: function(voiceNotes, jobType) {
        var categorized = {};

        if (!jobType || !jobType.checklist) {
            categorized['General Observations'] = voiceNotes.map(function(n) { return n.transcription; });
            return categorized;
        }

        for (var i = 0; i < voiceNotes.length; i++) {
            var note = voiceNotes[i].transcription;
            var matches = this.analyzeVoiceNote(note, jobType);

            if (matches.length > 0) {
                var categoryName = matches[0].categoryName;
                if (!categorized[categoryName]) {
                    categorized[categoryName] = [];
                }
                categorized[categoryName].push(note);
            } else {
                if (!categorized['General Observations']) {
                    categorized['General Observations'] = [];
                }
                categorized['General Observations'].push(note);
            }
        }

        return categorized;
    },

    // Convert casual voice note to professional BER assessment text
    professionalize: function(text) {
        var professional = text;
        var lower = text.toLowerCase();

        // Extract key data points
        var findings = [];

        // BUILDING FABRIC ANALYSIS
        if (lower.match(/wall|brick|cavity|block|solid/)) {
            if (lower.match(/solid brick|solid wall/)) {
                findings.push('**Building Fabric - External Walls:** The property features solid brick wall construction (pre-1980s typical construction). U-value estimated at 2.1 W/m²K. Recommendation: External or internal wall insulation required to achieve Part L compliance (target U-value: 0.21 W/m²K).');
            } else if (lower.match(/cavity/)) {
                findings.push('**Building Fabric - External Walls:** Cavity wall construction identified. ' +
                    (lower.match(/insulation|insulated/) ?
                        'Cavity insulation present, estimated U-value 0.35-0.55 W/m²K.' :
                        'Cavity appears uninsulated, estimated U-value 1.5 W/m²K. Cavity wall insulation recommended.'));
            }
        }

        // GLAZING ANALYSIS
        if (lower.match(/window|glazing|glass/)) {
            if (lower.match(/double glaz|double-glaz/)) {
                findings.push('**Glazing:** Double-glazed uPVC windows installed. Estimated U-value 1.8-2.0 W/m²K. Compliance: Acceptable for existing dwelling, but upgrade to A-rated windows (U-value ≤1.4 W/m²K) would improve BER rating by 5-10 kWh/m²/yr.');
            } else if (lower.match(/single glaz|single-glaz/)) {
                findings.push('**Glazing:** Single-glazed windows identified. Estimated U-value 4.8 W/m²K. **Critical:** Replacement with A-rated double or triple glazing essential for Part L compliance and thermal comfort. Priority upgrade item.');
            } else if (lower.match(/triple glaz/)) {
                findings.push('**Glazing:** High-performance triple-glazed windows installed. Estimated U-value 0.8-1.0 W/m²K. Excellent thermal performance, contributes positively to BER rating.');
            }
        }

        // HEATING SYSTEM ANALYSIS
        if (lower.match(/boiler|heating|radiator/)) {
            var boilerText = '';
            if (lower.match(/combi|combination/)) {
                boilerText = 'Combination boiler system identified';
            } else if (lower.match(/condensing/)) {
                boilerText = 'Condensing boiler system';
            } else {
                boilerText = 'Central heating boiler';
            }

            var efficiency = '';
            if (lower.match(/condensing/)) {
                efficiency = 'Seasonal efficiency estimated at 88-94% (SEDBUK rating: A/B).';
            } else if (lower.match(/\d+\s*year|age/)) {
                var age = lower.match(/(\d+)\s*year/);
                if (age && parseInt(age[1]) > 15) {
                    efficiency = 'Unit is over 15 years old, estimated efficiency 65-75% (SEDBUK D/E). **Recommendation:** Boiler replacement to achieve Part L compliance and reduce heating costs by 25-30%.';
                } else if (age && parseInt(age[1]) > 10) {
                    efficiency = 'Estimated efficiency 78-85% (SEDBUK C). Consider replacement within 3-5 years.';
                } else {
                    efficiency = 'Modern unit, estimated efficiency 88-92% (SEDBUK A/B). Satisfactory performance.';
                }
            }

            findings.push('**Heating System:** ' + boilerText + '. ' + efficiency);

            // Radiator analysis
            var radMatch = lower.match(/(\d+)\s*radiator/);
            if (radMatch) {
                findings.push('**Heat Distribution:** Property equipped with ' + radMatch[1] + ' radiators. ' +
                    (lower.match(/trv|thermostatic valve/) ?
                        'Thermostatic radiator valves (TRVs) installed - good practice for zone control and energy efficiency.' :
                        'Recommendation: Install TRVs on all radiators (except room with main thermostat) to improve zone control and achieve 8-12% heating energy savings.'));
            }
        }

        // INSULATION ANALYSIS
        if (lower.match(/insulation|attic|loft|roof/)) {
            var depthMatch = lower.match(/(\d+)\s*mm|(\d+)\s*millimeter/);
            if (depthMatch) {
                var depth = parseInt(depthMatch[1] || depthMatch[2]);
                if (depth < 100) {
                    findings.push('**Roof Insulation:** Current insulation depth ' + depth + 'mm. **Critical Deficiency:** Part L requires minimum 300mm mineral wool (U-value ≤0.16 W/m²K). Current U-value estimated 0.8-1.2 W/m²K. Priority upgrade: Top-up to 300mm would save 15-20% on heating costs.');
                } else if (depth < 200) {
                    findings.push('**Roof Insulation:** Current insulation depth ' + depth + 'mm, estimated U-value 0.25-0.35 W/m²K. Below current standards. Recommendation: Top-up to 300mm to achieve Part L compliance and optimal thermal performance.');
                } else if (depth >= 300) {
                    findings.push('**Roof Insulation:** Adequate insulation depth ' + depth + 'mm identified. Estimated U-value 0.13-0.16 W/m²K. Compliant with Part L requirements. Verify insulation type and condition during detailed survey.');
                }
            }
        }

        // VENTILATION ANALYSIS
        if (lower.match(/ventilation|extract|fan|air|vent/)) {
            if (lower.match(/mechanical.*ventilation|mvhr|mev/)) {
                findings.push('**Ventilation:** Mechanical ventilation system installed. Verify system type (MVHR/MEV), airflow rates, and filter condition. Ensure compliance with TGD Part F ventilation requirements (minimum 0.3 ACH).');
            } else if (lower.match(/extract.*fan|fan.*extract/)) {
                findings.push('**Ventilation:** Extract ventilation fans identified in wet rooms. Verify compliance with Part F: kitchen extract ≥60 l/s, bathroom ≥15 l/s. Natural ventilation via trickle vents and openable windows observed.');
            }
        }

        // TEMPERATURE/THERMAL COMFORT
        var tempMatch = lower.match(/(\d+)\s*degrees|(\d+)\s*°c/);
        if (tempMatch) {
            var temp = parseInt(tempMatch[1] || tempMatch[2]);
            if (temp < 18) {
                findings.push('**Thermal Performance:** Room temperature recorded at ' + temp + '°C. Below recommended comfort level (21°C for living areas per TGD L). Indicates inadequate heating system capacity or poor building fabric thermal performance. Further investigation required.');
            } else if (temp >= 18 && temp <= 22) {
                findings.push('**Thermal Performance:** Room temperature ' + temp + '°C. Within acceptable comfort range (18-21°C living areas, 18°C bedrooms per TGD L). Satisfactory thermal performance observed during survey.');
            }
        }

        // RENEWABLE ENERGY
        if (lower.match(/solar|heat pump|pv|photovoltaic|renewable/)) {
            if (lower.match(/solar.*pv|photovoltaic|solar panel/)) {
                findings.push('**Renewable Energy:** Solar PV system identified. Verify system capacity (kWp), orientation (south-facing optimal), and integration with electrical system. PV contribution will improve BER rating significantly.');
            }
            if (lower.match(/heat pump|ashp|gshp/)) {
                findings.push('**Renewable Heating:** Heat pump system installed. Verify COP (Coefficient of Performance), system type, and integration. Heat pumps can achieve 250-400% efficiency versus 90% for gas boilers, significantly improving BER rating.');
            }
        }

        // ORIENTATION
        if (lower.match(/south.*facing|south-facing/)) {
            findings.push('**Building Orientation:** South-facing elevation noted. Positive solar gain contribution, beneficial for passive heating. Consider solar thermal or PV installation on south-facing roof.');
        } else if (lower.match(/north.*facing|north-facing/)) {
            findings.push('**Building Orientation:** North-facing elevation noted. Limited solar gain, higher heating demand. Enhanced insulation recommended for north-facing walls.');
        }

        // If no specific findings, create general observation
        if (findings.length === 0) {
            professional = text.charAt(0).toUpperCase() + text.slice(1);
            if (!professional.match(/[.!?]$/)) {
                professional += '.';
            }
            findings.push('**Survey Observation:** ' + professional);
        }

        return findings.join('\n\n');
    }
};

console.log('✅ AI Processor loaded');

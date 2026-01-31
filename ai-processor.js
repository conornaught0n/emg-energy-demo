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

    // Convert casual voice note to professional text
    professionalize: function(text) {
        // Basic professionalization (in production: use GPT-4)
        var professional = text;

        // Capitalize first letter
        professional = professional.charAt(0).toUpperCase() + professional.slice(1);

        // Add period if missing
        if (!professional.match(/[.!?]$/)) {
            professional += '.';
        }

        // Replace casual terms with technical ones
        var replacements = {
            'degrees': '°C',
            'rads': 'radiators',
            'double glazed': 'double-glazed uPVC windows',
            'single glazed': 'single-glazed windows',
            'cold': 'inadequate thermal performance',
            'hot': 'elevated temperature',
            'old': 'aged',
            'new': 'recently installed'
        };

        for (var casual in replacements) {
            if (replacements.hasOwnProperty(casual)) {
                var regex = new RegExp('\\b' + casual + '\\b', 'gi');
                professional = professional.replace(regex, replacements[casual]);
            }
        }

        return professional;
    }
};

console.log('✅ AI Processor loaded');

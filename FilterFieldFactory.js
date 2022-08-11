(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * @private
     */
    Ext.define('Local.FilterFieldFactory', {
        singleton: true,
        requires: [
            'Rally.ui.inlinefilter.WorkspaceScopeField',
            'Rally.ui.inlinefilter.ArtifactSearchField',
            'Rally.ui.inlinefilter.UserSearchField',
//            Add Query Field
            'Local.RallyQueryField',
            'Rally.ui.combobox.MilestoneComboBox',
            'Rally.ui.combobox.ProjectComboBox',
            'Rally.ui.combobox.TagComboBox',
            'Rally.ui.combobox.ArtifactSearchComboBox',
            'Rally.ui.combobox.SearchComboBox',
            'Rally.ui.TextField',
            'Rally.util.Ref'
        ],

        getFieldConfig: function(model, fieldName, context) {
            var baseEditorConfig = this[fieldName] || {};
            Ext.applyIf(baseEditorConfig, {
                name: fieldName,
                fieldLabel: fieldName,
                allowBlank: false
            });

            var fieldDef = model.getField(fieldName);

            if (fieldDef) {
                baseEditorConfig = Ext.applyIf(this._getBaseEditorConfig(fieldDef, context, model), baseEditorConfig);
                if (fieldDef.getType() === 'object') {
                    baseEditorConfig.allowBlank = true;
                    baseEditorConfig.triggerCls = 'icon-search';
                }
                if (fieldDef.getType() === 'collection') {
                    baseEditorConfig.triggerCls = 'icon-search';
                }

                if (fieldDef.custom) {
                    baseEditorConfig.allowBlank = !fieldDef.required;
                }

                if (fieldDef.attributeDefinition && fieldDef.attributeDefinition.Constrained) {
                    if (fieldDef.getType() === 'object' || fieldDef.getType() === 'collection') {
                        baseEditorConfig.valueField = '_uuidRef';
                    }

                    if (fieldDef.custom && !fieldDef.required) {
                        baseEditorConfig.allowNoEntry = true;
                        baseEditorConfig.noEntryValue = '/none/-1';
                    }
                }

                baseEditorConfig.emptyText = Ext.String.format('Filter by {0}...', Rally.ui.renderer.FieldDisplayNameRenderer.getDisplayName(fieldDef));
            }

            if (baseEditorConfig.allowNoEntry && !baseEditorConfig.noEntryValue) {
                baseEditorConfig.noEntryValue = '/none/-1';
            }

            if (_.contains(baseEditorConfig.xtype, 'combobox')) {
                Ext.merge(baseEditorConfig, {
                    listeners: {
                        beforerender: function (combobox) {
                            combobox.refreshStore();
                        }
                    }
                });
            }

            return _.merge({}, baseEditorConfig, {
                autoExpand: false,
                context: context,
                plugins: ['rallyfieldvalidationui'],
                defaultSelectionPosition: null,
                storeConfig: {
                    autoLoad: false
                }
            });
        },

        getInitialValueForLegacyFilter: function(fieldConfig, initialValue) {
            if ((fieldConfig.allowNoEntry || fieldConfig.allowBlank) && (_.isNull(initialValue) || (_.isEmpty(initialValue) && _.isString(initialValue))) && !_.isUndefined(fieldConfig.noEntryValue)) {
                return fieldConfig.noEntryValue;
            }
            return initialValue;
        },

        getFieldConfigForLegacyFilter: function(fieldConfig, initialValue) {
            if(initialValue === fieldConfig.noEntryValue) {
                return fieldConfig;
            }

            var isRefUri = Rally.util.Ref.isRefUri(initialValue);
            var isRefOid = _.isNumber(Rally.util.Ref.getOidFromRef(initialValue));
            if (isRefUri && isRefOid && fieldConfig.valueField === '_uuidRef') {
                return Ext.merge(fieldConfig, {
                    valueField: '_ref'
                });
            }
            return fieldConfig;
        },

        _getBaseEditorConfig: function(fieldDef, context, model) {
            var editorConfig = {};
            var numericFieldTypes = ['quantity', 'integer'];

            if (fieldDef.getType() === 'text') {
                editorConfig = {
                    xtype: 'rallytextfield'
                };
            } else if (fieldDef.getType() === 'RallyQuery') {
                editorConfig = {
                    xtype: 'rallytextfield'
                };
            } else if (fieldDef.name === 'Tags') {
                editorConfig = {
                    xtype: 'rallytagcombobox',
                    allowNoEntry: false,
                    valueField: '_uuidRef',
                    hideLabel: true
                };
            } else if (fieldDef.name === 'Milestones') {
                editorConfig = {
                    xtype: 'rallymilestonecombobox',
                    valueField: '_uuidRef'
                };
            } else if (fieldDef.name === 'Parent' && fieldDef.attributeDefinition.SchemaType === 'Project') {
                editorConfig = {
                    xtype: 'rallyprojectcombobox',
                    valueField: '_uuidRef',
                    allowNoEntry: true,
                    noEntryText: '-- No Parent --'
                };
            } else if (fieldDef.attributeDefinition.Custom === true && fieldDef.attributeDefinition.AttributeType === "COLLECTION") {
                var allowedValueStore = fieldDef.getAllowedValueStore({
                    autoLoad: false,
                    remoteFilter: false,
                    remoteSort: false,
                    limit: Infinity
                });
                editorConfig = {
                    xtype: 'rallycombobox',
                    store: allowedValueStore,
                    displayField: "StringValue"
                };
            } else if (!fieldDef.editor && fieldDef.attributeDefinition.AllowedValueType._ref) {
                editorConfig = {
                    xtype: 'rallyartifactsearchcombobox',
                    allowNoEntry: true,
                    valueField: '_uuidRef',
                    storeConfig: {
                        models: [fieldDef.attributeDefinition.AllowedValueType._refObjectName],
                        context: {
                            workspace: context.getDataContext().workspace,
                            project: null
                        }
                    }
                };
                if (fieldDef.name === 'Requirement') {
                    editorConfig.storeConfig.models = ['userstory'];
                } else if (fieldDef.name === 'WorkProduct') {
                    if (this._isTestCase(model)) {
                        editorConfig.storeConfig.models = ['userstory', 'defect'];
                    } else if (this._isTask(model)) {
                        editorConfig.storeConfig.models = ['userstory', 'defect', 'testset', 'defectsuite'];
                    }
                } else if (fieldDef.name === 'TestFolder') {
                    Ext.merge(editorConfig, {
                        storeType:  'Rally.data.wsapi.Store',
                        storeConfig: {
                            model: editorConfig.storeConfig.models[0],
                            models: undefined
                        }
                    });
                } else if (fieldDef.name === 'BuildDefinition') {
                    Ext.merge(editorConfig, {
                        xtype:  'rallysearchcombobox',
                        allowNoEntry: false,
                        storeConfig: {
                            model: editorConfig.storeConfig.models[0],
                            models: undefined
                        }
                    });
                }
            } else if (_.contains(numericFieldTypes, fieldDef.getType())) {
                editorConfig = this._getClonedEditorConfig(fieldDef);
                editorConfig.hideTrigger = false;
            } else {
                editorConfig = this._getClonedEditorConfig(fieldDef);
            }

            Ext.apply(editorConfig, {
                fieldLabel: fieldDef.displayName
            });

            return editorConfig;
        },

        _getClonedEditorConfig: function(fieldDef){
            var editorConfig = _.clone(fieldDef.editor);
            if (editorConfig && editorConfig.field && editorConfig.field.xtype) {
                editorConfig = _.clone(editorConfig.field);
            }
            return editorConfig;
        },

        _isTask: function(model) {
            return _.some(_.invoke(this._getModels(model), 'isTask'));
        },

        _isTestCase: function(model) {
            return _.some(_.invoke(this._getModels(model), 'isTestCase'));
        },

        _getModels: function(model) {
            return model.getArtifactComponentModels ? model.getArtifactComponentModels() : [model];
        },

        ScheduleState: {
            multiSelect: true,
            allowClear: false,
            getFilter: function() {
                return Rally.data.wsapi.Filter.or(_.map(this.lastValue, function(value) {
                    return {
                        property: 'ScheduleState',
                        operator: '=',
                        value: value
                    };
                }, this));
            }
        },

        Owner: {
            allowNoEntry: true,
            noEntryValue: '/user/-1',
            includeWorkspaceUsers: true
        },

        SubmittedBy: {
            allowNoEntry: true,
            noEntryValue: '/user/-1',
            includeWorkspaceUsers: true
        },

        ArtifactSearch: {
            xtype: 'rallyartifactsearchfield'
        },

//        Define RallyQueryField
        RallyQuery: {
            xtype: 'rallyqueryfield',
            emptyText: 'Query will be stored here'
        },
        
        UserSearch: {
            xtype: 'rallyusersearchfield',
            emptyText: 'Filter by Username, Email etc...'
        },

        WorkspaceScope: {
            xtype: 'rallyworkspacescopefield',
            allowClear: false,
            value: '/scope/-1'
        },

        ModelType: {
            xtype: 'rallymodeltypepicker',
            fieldLabel: 'Type',
            emptyText: 'Filter by Type...',
            allowClear: false
        },

        Tags: {
            triggerAction: 'all'
        }
    });
})();
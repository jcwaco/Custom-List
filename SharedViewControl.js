/**
 * Over-Ride the default
 */
(function () {

    var Ext = window.Ext4 || window.Ext;

    /**
     * @private
     */
    Ext.define('Local.GridBoardSharedViewControl', {
        extend:'Ext.AbstractPlugin',
        alias: 'plugin.rallygridboardsharedviewcontrol',

        requires: [
            'Rally.ui.gridboard.SharedViewComboBox'
        ],

        mixins: ['Rally.ui.gridboard.plugin.GridBoardControlShowable'],
        config: {
            sharedViewConfig: {
                defaultViews: [],
                enableUrlSharing: false,
                enableReadingUserPref: false,
                suppressViewNotFoundNotification: false
            },
            additionalFilters: []
        },

        headerPosition: 'left',
        init: function(cmp) {
            this.callParent(arguments);
            console.log ('Using Local version');
            this.showControl();
        },

        getControlCmpConfig: function() {
            return Ext.merge({
                xtype: 'rallysharedviewcombobox',
                cmp: this.cmp,
                context: this.context || this.cmp.getContext(),
                margin: '3 0 0 0',
                enableUrlSharing: this.sharedViewConfig.enableUrlSharing,
                enableReadingUserPref: this.sharedViewConfig.enableReadingUserPref,
                additionalFilters: this.additionalFilters,
                suppressViewNotFoundNotification: this.sharedViewConfig.suppressViewNotFoundNotification
            }, this.sharedViewConfig);
        }
    });
})();
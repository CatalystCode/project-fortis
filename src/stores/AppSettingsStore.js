import Fluxxor from 'fluxxor';
import { Actions } from '../actions/Actions';

export const AppSettingsStore = Fluxxor.createStore({
    initialize() {
        this.dataStore = {
            settings: {},
            language: "en",
        };

        this.bindActions(
            Actions.constants.APP.INITIALIZE, this.handleLoadSettings,
            Actions.constants.DASHBOARD.CHANGE_LANGUAGE, this.handleLanguageChange,
        );
    },

    getState() {
        return this.dataStore;
    },

    handleLoadSettings(payload) {
        this.dataStore.settings = payload;
        this.emit("change");
    },

    handleLanguageChange(language) {
        this.dataStore.language = language;
        this.emit("change");
    },

});
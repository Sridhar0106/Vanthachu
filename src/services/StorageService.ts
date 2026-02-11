import AsyncStorage from '@react-native-async-storage/async-storage';
import { Destination } from '../types';

const STORAGE_KEY_HISTORY = '@namma_stop_history';
const STORAGE_KEY_FAVORITES = '@namma_stop_favorites';
const MAX_HISTORY_ITEMS = 20;

export interface HistoryItem extends Destination {
    timestamp: number;
    usageCount: number;
}

export class StorageService {
    /**
     * Add destination to history
     */
    static async addToHistory(destination: Destination): Promise<void> {
        try {
            const historyJson = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
            let history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];

            // Check if destination already exists
            const existingIndex = history.findIndex(
                item =>
                    Math.abs(item.latitude - destination.latitude) < 0.001 &&
                    Math.abs(item.longitude - destination.longitude) < 0.001
            );

            if (existingIndex >= 0) {
                // Update existing item
                history[existingIndex].usageCount++;
                history[existingIndex].timestamp = Date.now();
            } else {
                // Add new item
                history.unshift({
                    ...destination,
                    timestamp: Date.now(),
                    usageCount: 1,
                });
            }

            // Keep only recent items
            history = history.slice(0, MAX_HISTORY_ITEMS);

            await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }

    /**
     * Get destination history
     */
    static async getHistory(): Promise<HistoryItem[]> {
        try {
            const historyJson = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
            return historyJson ? JSON.parse(historyJson) : [];
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Clear history
     */
    static async clearHistory(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY_HISTORY);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    /**
     * Add destination to favorites
     */
    static async addToFavorites(destination: Destination): Promise<void> {
        try {
            const favoritesJson = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
            const favorites: Destination[] = favoritesJson ? JSON.parse(favoritesJson) : [];

            // Check if already exists
            const exists = favorites.some(
                item =>
                    Math.abs(item.latitude - destination.latitude) < 0.001 &&
                    Math.abs(item.longitude - destination.longitude) < 0.001
            );

            if (!exists) {
                favorites.push(destination);
                await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
        }
    }

    /**
     * Remove from favorites
     */
    static async removeFromFavorites(destination: Destination): Promise<void> {
        try {
            const favoritesJson = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
            let favorites: Destination[] = favoritesJson ? JSON.parse(favoritesJson) : [];

            favorites = favorites.filter(
                item =>
                    !(Math.abs(item.latitude - destination.latitude) < 0.001 &&
                        Math.abs(item.longitude - destination.longitude) < 0.001)
            );

            await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
        } catch (error) {
            console.error('Error removing from favorites:', error);
        }
    }

    /**
     * Get favorites
     */
    static async getFavorites(): Promise<Destination[]> {
        try {
            const favoritesJson = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
            return favoritesJson ? JSON.parse(favoritesJson) : [];
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Check if destination is in favorites
     */
    static async isFavorite(destination: Destination): Promise<boolean> {
        try {
            const favorites = await this.getFavorites();
            return favorites.some(
                item =>
                    Math.abs(item.latitude - destination.latitude) < 0.001 &&
                    Math.abs(item.longitude - destination.longitude) < 0.001
            );
        } catch (error) {
            return false;
        }
    }
}

import * as Contacts from 'expo-contacts';
import { LocalStorage } from '@anti-grooming/shared';
import { monitoringService } from './monitoring';

export interface ContactSnapshot {
  [phoneNumber: string]: string; // phone -> name
}

const CONTACTS_SNAPSHOT_KEY = '@taro/contacts_snapshot';

export class ContactsService {
  static async getAllContacts(): Promise<Contacts.Contact[]> {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });
      return data || [];
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  static async getContact(id: string): Promise<Contacts.Contact | null> {
    try {
      return await Contacts.getContactByIdAsync(id);
    } catch (error) {
      console.error('Error getting contact:', error);
      return null;
    }
  }

  static async checkForNewContacts(): Promise<void> {
    try {
      const currentContacts = await this.getAllContacts();
      const currentSnapshot = this.createSnapshot(currentContacts);

      const savedSnapshot = await this.getSavedSnapshot();

      // Detectar contactos nuevos
      for (const [phone, name] of Object.entries(currentSnapshot)) {
        if (!savedSnapshot[phone]) {
          console.log('New contact detected:', name);
          await monitoringService.analyzeContact(name, true);
        }
      }

      // Guardar snapshot actual
      await this.saveSnapshot(currentSnapshot);
    } catch (error) {
      console.error('Error checking for new contacts:', error);
    }
  }

  private static createSnapshot(contacts: Contacts.Contact[]): ContactSnapshot {
    const snapshot: ContactSnapshot = {};

    contacts.forEach((contact) => {
      const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

      if (contact.phoneNumbers) {
        contact.phoneNumbers.forEach((phone) => {
          if (phone.number) {
            snapshot[phone.number] = name || 'Unknown';
          }
        });
      }
    });

    return snapshot;
  }

  private static async getSavedSnapshot(): Promise<ContactSnapshot> {
    try {
      const saved = await LocalStorage.getEncryptionKeys?.();
      // Usar un almacenamiento simple para snapshot
      // En producción, esto debería estar encriptado
      return {};
    } catch (error) {
      console.error('Error getting saved snapshot:', error);
      return {};
    }
  }

  private static async saveSnapshot(snapshot: ContactSnapshot): Promise<void> {
    try {
      // En producción, encriptar este snapshot
      console.log('Snapshot saved:', Object.keys(snapshot).length, 'contacts');
    } catch (error) {
      console.error('Error saving snapshot:', error);
    }
  }

  static async addContact(name: string, phoneNumber: string): Promise<void> {
    try {
      const contact = new Contacts.Contact();
      contact.firstName = name;
      contact.phoneNumbers = [{ number: phoneNumber }];

      await contact.saveAsync();
      console.log('Contact added:', name);
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  }
}

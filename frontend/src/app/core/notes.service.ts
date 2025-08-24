// core/notes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ClientNote {
    _id: string;
    client: string;
    author: string;
    text: string;
    createdAt: string;
    updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
    private readonly BASE = '/api/notes';

    constructor(private http: HttpClient) { }

    list(clientId: string) {
        return this.http.get<ClientNote[]>(`${this.BASE}/${clientId}`);
    }

    create(clientId: string, text: string) {
        return this.http.post<ClientNote>(`${this.BASE}/${clientId}`, { text });
    }

    update(noteId: string, text: string) {
        return this.http.patch<ClientNote>(`${this.BASE}/${noteId}`, { text });
    }

    remove(noteId: string) {
        return this.http.delete<{ message: string }>(`${this.BASE}/${noteId}`);
    }
}

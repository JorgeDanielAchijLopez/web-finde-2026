// Fetch notes from the API
fetch('http://localhost:3001/notes')
.then(response => response.json())
.then(data => {
    // This is an example of a note:
    // {
    //     "id": 1,
    //     "title": "Migration notes",
    //     "body": "Pinned column came from 0001",
    //     "authorId": 1,
    //     "pinned": true,
    //     "createdAt": "2026-10-03T16:21:17.139Z",
    //     "authorName": "Ada",
    //     "authorEmail": "ada@example.com"
    //   }
    data.notes.forEach(note => {
        const noteElement = document.importNode(document.getElementById('note-template').content, true);
        noteElement.querySelector('h2').textContent = note.title;
        noteElement.querySelector('.note-body').textContent = note.body;
        noteElement.querySelector('.note-author').textContent = note.authorName.toUpperCase();
        noteElement.querySelector('.note-created-at').textContent = note.createdAt;
        document.getElementById('notes').appendChild(noteElement);
    });
});


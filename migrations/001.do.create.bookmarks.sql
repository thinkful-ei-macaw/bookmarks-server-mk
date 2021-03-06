CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, 
    title TEXT NOT NULL, 
    url TEXT NOT NULL, 
    description TEXT, 
    rating INTEGER CHECK (rating >= 1 AND rating <= 5 ) NOT NULL
);
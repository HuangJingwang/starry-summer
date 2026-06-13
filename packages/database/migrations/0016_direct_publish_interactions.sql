alter table comments
  alter column status set default 'approved';

alter table guestbook_entries
  alter column status set default 'approved';

-- Добавляем колонку user_id
ALTER TABLE demos ADD COLUMN user_id UUID REFERENCES users(id);

-- Заполняем user_id значениями из связанных компонентов
UPDATE demos d
SET user_id = c.user_id
FROM components c
WHERE d.component_id = c.id;

-- Делаем колонку NOT NULL после заполнения данных
ALTER TABLE demos ALTER COLUMN user_id SET NOT NULL; 
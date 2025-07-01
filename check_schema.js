const pool = require('./config/db');

const checkSchema = async () => {
  try {
    console.log('Проверяем структуру таблиц...\n');
    
    // Проверяем структуру таблицы tasks
    const [taskColumns] = await pool.query('DESCRIBE tasks');
    console.log('Структура таблицы tasks:');
    taskColumns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Проверяем структуру таблицы projects
    const [projectColumns] = await pool.query('DESCRIBE projects');
    console.log('Структура таблицы projects:');
    projectColumns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Проверяем структуру таблицы users
    const [userColumns] = await pool.query('DESCRIBE users');
    console.log('Структура таблицы users:');
    userColumns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

  } catch (error) {
    console.error('Ошибка при проверке схемы:', error);
  } finally {
    await pool.end();
  }
};

checkSchema(); 
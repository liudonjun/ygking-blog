---
description: 深入讲解 Room 数据库的架构设计、性能优化、离线缓存与多模块协同技巧。
tag:
  - Kotlin
  - Room
  - 数据库
sidebar: true
---

# Android Kotlin Room 数据库进阶实践

## 架构设计

- 使用 `core/database` 模块集中管理实体与 Dao。
- 结合 Repository 模式提供领域接口。
- 借助 Flow/Channel 实现实时更新。

## 数据库配置

```kotlin
@Database(
    entities = [ArticleEntity::class, AuthorEntity::class],
    version = 4,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun articleDao(): ArticleDao
}

fun provideDatabase(context: Context): AppDatabase = Room.databaseBuilder(
    context,
    AppDatabase::class.java,
    "app.db"
).fallbackToDestructiveMigrationOnDowngrade()
 .addMigrations(MIGRATION_3_4)
 .build()
```

## 实体与关联

```kotlin
@Entity(tableName = "article")
data class ArticleEntity(
    @PrimaryKey val id: Long,
    val title: String,
    val authorId: Long,
    val publishTime: Instant
)

@Entity(tableName = "author")
data class AuthorEntity(
    @PrimaryKey val id: Long,
    val name: String
)

data class ArticleWithAuthor(
    @Embedded val article: ArticleEntity,
    @Relation(parentColumn = "authorId", entityColumn = "id")
    val author: AuthorEntity
)
```

### Dao

```kotlin
@Dao
interface ArticleDao {
    @Transaction
    @Query("SELECT * FROM article ORDER BY publishTime DESC")
    fun observeArticles(): Flow<List<ArticleWithAuthor>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertArticles(articles: List<ArticleEntity>)
}
```

## 迁移与测试

```kotlin
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE article ADD COLUMN isPinned INTEGER NOT NULL DEFAULT 0")
    }
}

@RunWith(AndroidJUnit4::class)
class MigrationTest {
    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        AppDatabase::class.java.canonicalName,
        FrameworkSQLiteOpenHelperFactory()
    )
}
```

## 多模块协同

- `core/model` 定义 Domain Model。
- 在 DAO 层返回 Domain Model，或在 Repository 层映射。
- 对 Feature 模块暴露接口而非实体。

```kotlin
interface ArticleRepository {
    fun observeArticles(): Flow<List<Article>>
    suspend fun sync()
}

class ArticleRepositoryImpl @Inject constructor(
    private val dao: ArticleDao,
    private val api: ArticleApi
) : ArticleRepository {
    override fun observeArticles(): Flow<List<Article>> =
        dao.observeArticles().map { list -> list.map { it.toDomain() } }

    override suspend fun sync() {
        val remote = api.fetchArticles()
        dao.insertArticles(remote.map { it.toEntity() })
    }
}
```

## 性能优化

- 开启 `RoomDatabase.Builder.setQueryCallback` 监控 SQL。
- 使用 `EXPLAIN QUERY PLAN` 分析索引需求。
- 大量插入时使用 `@Transaction` + `insertAll`。

```kotlin
@Transaction
suspend fun replaceAll(articles: List<ArticleEntity>) {
    deleteAll()
    insertArticles(articles)
}
```

## 协程与事务

- Room `suspend` 函数默认在事务中执行。
- 自定义事务：

```kotlin
@Transaction
suspend fun ArticleDao.upsert(article: ArticleEntity) {
    val old = getById(article.id)
    if (old == null) insert(article) else update(article)
}
```

## 常见问题

| 问题       | 原因                   | 解决方案                                   |
| ---------- | ---------------------- | ------------------------------------------ |
| UI 卡顿    | 在主线程执行数据库操作 | 确保使用 `suspend`/`Flow` + Dispatchers.IO |
| 迁移失败   | schema_version 不匹配  | 更新 `exportSchema`，编写准确迁移脚本      |
| 多模块冲突 | DAO 重复定义           | 在核心模块统一管理 DAO                     |

## 总结

1. Room 通过 Flow、协程与 Compose 无缝衔接，适合构建实时数据体验。
2. 设计清晰的实体、迁移与 Repository，可提升可维护性。
3. 对性能、迁移、测试持续投入，使数据库层稳定可靠，为离线与同步能力打下基础。

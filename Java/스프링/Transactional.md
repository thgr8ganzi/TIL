## TRANSACTIONAL

* 트랜잭션은 데이터베이스의 상태를 변화시키기 위해 수행하는 작업의 단위이다.
* 스프링은 데이터 접근 기술마다 데이터베이스와 연결 방법이 다르기 때문에 트랜잭션 처리를 추상화하여 제공한다.
* JDBC -> Connection
* JPA -> EntityManager
* MyBatis -> SqlSession
* Hibernate -> Session
* JdbcTemplate -> JdbcTemplate
* 스프링은 트랜잭션 처리를 위해 PlatformTransactionManager 인터페이스를 제공한다.
```
public interface PlatformTransactionManager extends TransactionManager {
	TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
	void commit(TransactionStatus status) throws TransactionException;
	void rollback(TransactionStatus status) throws TransactionException;
}
public abstract class AbstractPlatformTransactionManager
		implements PlatformTransactionManager, ConfigurableTransactionManager, Serializable {
        ...
}
```

### 선언적 트랜잭션 

* 스프링은 PlatformTransactionManager 인터페이스를 구현한 다양한 트랜잭션 매니저를 제공하지만 비즈니스 로직과 트랜잭션 처리를 분리하기 선언적 트랜잭션을 제공한다.
* @Transactional 어노테이션을 사용하여 트랜잭션을 적용할 수 있다.
* AOP 프록시를 통해 활성화 되고 트랜잭션 관련 메타데이터를 참조하여 생성한다.
```
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
@Reflective
public @interface Transactional {

	@AliasFor("transactionManager")
	String value() default "";
	@AliasFor("value")
	String transactionManager() default "";
	String[] label() default {};
	Propagation propagation() default Propagation.REQUIRED;
	Isolation isolation() default Isolation.DEFAULT;
	int timeout() default TransactionDefinition.TIMEOUT_DEFAULT;
	String timeoutString() default "";
	boolean readOnly() default false;
	Class<? extends Throwable>[] rollbackFor() default {};
	String[] rollbackForClassName() default {};
	Class<? extends Throwable>[] noRollbackFor() default {};
	String[] noRollbackForClassName() default {};

}
```

### 트랜잭션 속성

* propagation : 트랜잭션 전파 방식을 설정한다.
* isolation : 격리(고립) 수준을 설정한다.
* timeout : 트랜잭션 제한 시간을 설정한다.
* readOnly : 읽기 전용 트랜잭션을 설정한다.
* rollbackFor : 롤백을 수행할 예외를 설정한다.
* noRollbackFor : 롤백을 수행하지 않을 예외를 설정한다.

### Propagation

* 트랜잭션을 시작하거나 기존 트랜 잭션에 참여하는 방법을 결정하는 속성
* Required
  * 전파 기본 속성
  * 기존 트랜잭션이 존재하면 참여하고 없으면 새로운 트랜잭션을 시작한다.
* RequiresNew
  * 항상 새로운 트랜잭션을 시작한다.
  * 기존 트랜잭션이 존재하면 일시 중지하고 새로운 트랜잭션을 시작한다.
* Supports
  * 기존 트랜잭션이 존재하면 참여하고 없으면 트랜잭션 없이 실행한다.
* Nested
  * 이미 진행중인 트랜잭션이 있으면 중첩 트랜잭션 시작
  * 부모 트랜잭션 커밋, 롤백엔 영향을 받음
  * 자신의 커밋, 롤백은 부모 태랜잭션에 영향을 못줌
* Never
  * 트랜잭션을 사용하지 않게 한다. 
  * 트랜잭션이 존재하면 예외 발생
* Mandatory
  * 반드시 트랜잭션이 있어야 한다.
  * 트랜잭션이 없으면 예외 발생
* NotSupported
  * 트랜잭션을 사용하지 않게 한다.
  * 트랜잭션이 존재하면 일시 중지한다.
```
public enum Propagation {

	REQUIRED(TransactionDefinition.PROPAGATION_REQUIRED),
	SUPPORTS(TransactionDefinition.PROPAGATION_SUPPORTS),
	MANDATORY(TransactionDefinition.PROPAGATION_MANDATORY),
	REQUIRES_NEW(TransactionDefinition.PROPAGATION_REQUIRES_NEW),
	NOT_SUPPORTED(TransactionDefinition.PROPAGATION_NOT_SUPPORTED),
	NEVER(TransactionDefinition.PROPAGATION_NEVER),
	NESTED(TransactionDefinition.PROPAGATION_NESTED);
	
	private final int value;
	Propagation(int value) {
		this.value = value;
	}
	public int value() {
		return this.value;
	}
}
```

### ISOlATION

* 여러 트랜잭션이 진행될때에 트랜잭션의 작업 결과를 타 트랜잭션에게 어떻게 노출할지 결정
* Default
  * 데이터베이스 기본 격리 수준을 사용한다.
  * 데이터베이스에 따라 다르다.
  * Oracle : READ_COMMITTED
  * PostgreSQL : READ_COMMITTED
  * MySQL : REPEATABLE_READ
* ReadUncommitted
  * 커밋되지 않은 데이터도 읽을 수 있다.
  * 데이터의 정확성은 떨어지지만 성능은 좋다.
* ReadCommitted
  * 커밋되지 않으면 노출 되지 않는다. 
* RepeatableRead
  * 트랜잭션 내에서 조회한 데이터는 다른 트랜잭션에서 변경되지 않는다
  * 트랜잭션 시작전 스냅샷을 만들어와 스냅샷 내에서 데이터 조회
* Serializable
  * 트랜잭션 내 순차적 진행

#### 격리 수준에 따른 문제

| isolationLevel  | DirtyRead  | NonRepeatableRead  | PhantomRead  |
|:---------------:|:----------:|:------------------:|:------------:|
| ReadUncommitted | O          | O                  | O            |
| ReadCommitted   | X          | O                  | O            |
| RepeatableRead  | X          | X                  | O            |
| Serializable    | X          | X                  | X            |

* DirtyRead
  * 다른 트랜잭션이 커밋되지 않은 데이터를 읽을 수 있다.
* NonRepeatableRead
  * 같은 트랜잭션 내에서 같은 쿼리를 실행해도 결과가 다를 수 있다.
* PhantomRead
  * 같은 쿼리를 실행해도 결과가 다를 수 있다.

* 격리수준(낮은 수준 -> 높은 수준)
  * ReadUncommitted -> ReadCommitted -> RepeatableRead -> Serializable
```
public enum Isolation {

	DEFAULT(TransactionDefinition.ISOLATION_DEFAULT),
	READ_UNCOMMITTED(TransactionDefinition.ISOLATION_READ_UNCOMMITTED),
	READ_COMMITTED(TransactionDefinition.ISOLATION_READ_COMMITTED),
	REPEATABLE_READ(TransactionDefinition.ISOLATION_REPEATABLE_READ),
	SERIALIZABLE(TransactionDefinition.ISOLATION_SERIALIZABLE);

	private final int value;
	Isolation(int value) {
		this.value = value;
	}
	public int value() {
		return this.value;
	}

}
```

### Timeout

* 트랜잭션을 수행하는 제한 시간을 설정 가능
* 기본옵션은 -1로 설정되어 있어 제한 시간이 없다.

### ReadOnly

* 트랜잭션 내에서 데이터를 조작하려는 시도를 막음
* 읽기 전용 트랜잭션은 데이터베이스에 부하를 줄일 수 있다.
* 데이터베이스 벤더에 따라 읽기 전용 트랜잭션을 지원하지 않을 수 있다.

### RollbackFor

* 기본적으로 RuntimeException 이 발생하면 롤백이 수행된다.
* checked 예외도 롤백을 수행하려면 rollbackFor 속성을 사용한다.

### NoRollbackFor

* 롤백을 수행하지 않을 예외를 설정한다.

### 주의사항

* public 메서드에만 적용 가능
* 클래스에 적용하면 모든 메서드에 적용된다.
* 클래스에 적용하면 하위 클래스에 적용되지 않는다.
* 
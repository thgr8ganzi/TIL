
## JUNIT

* 자바 언어용 테스트 프레임워크 
* 테스트주도개발 면에서 중요하며 SUnit 과 함께 시작된 XUnit 이라는 이름의 유닛테스트 프레임워크 계열의 하나
* 단위테스트란 어플리케이션을 구성하는 하나의 기능이 독립적으로 올바르게 작동하는지 테스트하는것
* JUnit 은 테스트 케이스를 만들고 실행하는데 사용되는 프레임워크
* 개발 및 기능이 변경될때마다 서버를 구동하는것이 불필요하게 하기 위하여
* JUnit 은 개별 테스트의 독립성을 보장하고, 테스트 사이의 상호 관계에서 발생하는 부작용 방지를 위해 테스트 메소드 실행전 각각의 새로운 인스턴스 생성
* 이를 통해 개별 메서드의 완전히 독립적인 환경 제공 이를 메서드 생명주기라고 함

### JUNIT4, JUNIT5

* JUnit4 : 2006년 출시, 현재까지 많이 사용되고 있는 버전, JUnit Platform,JUnit Vintage 라는 모듈을 통해 JUnit4 사용 가능
* JUnit5 : 2017년 출시, JUnit5 부터는 JUnit Platform, JUnit Engine, JUnit API 세가지 모듈로 구성
* JUnit4 는 하나의 jar 파일이 dependency 로 추가되고 JUnit 이 여러개의 라이브러리 참조
* JUnit Platform
  * JVM 에서 동작하는 테스트 프레임워크
  * TestEngine 인터페이스 정의
  * TestEngine 은 테스트를 찾고 실행하는 역할
* JUnit Jupiter
  * TestEngine 의 구현체
  * Jupiter API(JUnit5 를 위한 테스트 API)를 사용하여 작성한 테스트 코드를 실행할때 사용
* JUnit Vintage
  * TestEngine 의 구현체
  * 기존 JUnit3,4 코드를 실행할때 사용
* JUnit5 는 자바8 이상부터 사용가능, 스프링부트 2.2 이상부터 자동적용

```
@SpringBootTest // Spring Boot 기반 테스트를 실행하는 테스트 클래스에 지정할 수 있는 주석입니다.
@TestInstance(TestInstance.Lifecycle.PER_CLASS) // 테스트 클래스의 인스턴스 라이프 사이클을 지정하는 데 사용.
//    PER_CLASS: 이 모드를 사용하면 테스트 클래스당 한 번씩 새 테스트 인스턴스가 생성됩니다. 이는 기본값입니다.
//    PER_METHOD: 이 모드를 사용하면 각 테스트 메서드, 테스트 팩토리 메서드 또는 테스트 템플릿 메서드에 대해 새 테스트 인스턴스가 생성됩니다.이 모드는 JUnit 버전 1~4의 동작과 유사합니다.
class StudentTest {
    @DisplayName("학생 객체 생성 테스트") // 테스트 케이스의 이름을 지정 공백, 특수 문자, 이모티콘까지 포함될 수 있다.
    @Test // 테스트 케이스임을 알림
    @Disabled // 테스트를 비활성화하는 데 사용, 테스트를 임시로 비활성화하고 나중에 다시 활성화할 수 있습니다.
    public void create() throws Exception{
        Student student = new Student("John", 20);
        System.out.println(student.getName());
    }
    @Test
    public void create2() throws Exception{
        System.out.println("create2");
    }
    @BeforeEach // 테스트 메소드 실행 전에 실행되는 메소드, 테스트에 필요한 목업 데이터 세팅, 모든 테스트 메소드 실행전 실행됨
    public void beforeEach() {
        System.out.println("테스트 시작전");
    }
    @BeforeAll // @BeforeEach 메소드와 달리 @BeforeAll 메소드는 주어진 테스트 클래스에 대해 한 번만 실행됩니다. static 으로 선언해야 사용가능
    public static void beforeAll() {
        System.out.println("테스트 시작전 All");
    }
    @AfterEach // 테스트 메소드 실행 후에 실행되는 메소드, 각각 테스트 메서드 실행후 특정 작업 할경우, 모든 테스트 메소드 실행후 실행
    public void afterEach() {
        System.out.println("테스트 시작후");
    }
    @AfterAll // @AfterEach 메소드와 달리 @AfterAll 메소드는 주어진 테스트 클래스에 대해 한 번만 실행됩니다., static 으로 선언해야 사용가능
    public static void afterAll() {
        System.out.println("테스트 시작후 All");
    }
}
```

### ParameterizedTest

```
    @ParameterizedTest
//    주석이 달린 메서드가 매개변수화된 테스트 메서드임을 알리는 데 사용, 이러한 메서드는 비공개이거나 정적이어서는 안 됩.
    @ValueSource(strings = {"John", "Jane", "Doe"})
//    리터럴 값 배열에 대한 액세스를 제공하는 Arguments, 지원되는 유형에는 shorts, bytes, ints, longs, floats, doubles, chars, boolean, strings 및 클래스가 포함. 유형 중 하나만 지정
    @NullSource
//    메서드에 null 인수를 제공하는 ArgumentsSource
    @EmptySource
//    메서드에 단일 빈 인수를 제공하는 ArgumentsSource
    @CsvSource(value = {"test1:FIRST", "test2:SECOND", "test3:THIRD"}, delimiterString = ":")
//    value 속성 또는 textBlock 속성을 통해 제공된 하나 이상의 CSV 레코드에서 쉼표로 구분된 값(CSV)을 읽는 ArgumentsSource, delimiterString 속성을 사용하여 구분자를 지정
    public void param(String name) throws Exception{
        System.out.println(name);
    }
    @RepeatedTest(value = 10, name = "{displayName} 중 {currentRepetition} of {totalRepetitions}")
//    테스트 메서드를 반복하는 데 사용, 지정된 횟수만큼 테스트 메서드를 반복 실행
    @DisplayName("반복 테스트")
    void repeatedTest() {
        System.out.println("repeatedTest");
    }
```

### Assertions

* JUnit5 는 다양한 어설션 기능을 제공
* 어설션은 테스트에서 예상한 결과와 실제 결과를 비교하여 검증하는 기능
* 모든 JUnit Assertions 는 static 메소드로 제공
```
    @ParameterizedTest
    @ValueSource(ints = {1})
    @DisplayName("숫자 일치 assertion 테스트")
    public void test1(int num) throws Exception{
        assertEquals(num, 1); // 예상값과 실제값이 동일한지 테스트
        assertNotEquals(num, 2); // 예상값과 실제값이 다른지 테스트
        assertSame(num, 1); // 예상객체와 실제객체가 동일한지 테스트
        assertNotSame(num, 2); // 예상객체와 실제객체가 다른지 테스트
        assertTrue(num == 1); // 조건이 참인지 테스트
        assertFalse(num == 2); // 조건이 거짓인지 테스트
        assertNull(null); // 객체가 null인지 테스트
        assertNotNull(num); // 객체가 null이 아닌지 테스트
        assertThrows(Exception.class, () -> {throw new Exception();}); // 예외가 발생하는지 테스트
        assertDoesNotThrow(() -> {}); // 예외가 발생하지 않는지 테스트
        assertTimeout(Duration.ofMillis(10), () -> Thread.sleep(1)); // 지정된 시간 내에 실행이 완료되는지 테스트
        assertAll(
                () -> assertEquals(num, 1),
                () -> assertEquals(num, 2),
                () -> fail() // 테스트 실패 처리
        ); // 제공된 모든 실행 파일이 예외를 발생시키지 않는지 확인.
    }
```

### assertThat(assertj)

* `testImplementation 'org.assertj:assertj-core:3.25.1'` 종속성 추가
* `import static org.junit.jupiter.api.Assertions.*;`
* <a href="https://assertj.github.io/doc/">assertj</a> 는 JUnit 의 assertThat 을 대체하는 라이브러리
* JUnit 의 assertThat 은 import 가 잘 지원되지 않음
```
    @Test
    @DisplayName("숫자 테스트")
    public void number_test() throws Exception{
        int num = 3;
        int result = add(num, 2);

//        assert j
//        다양한 유형에 대한 어설션 메서드의 진입점. 이 클래스의 각 메서드는 유형별 어설션 개체에 대한 정적 팩토리.
        assertThat(5).isEqualTo(result);
    }
    int add(int num1, int num2){
        return num1 + num2;
    }
```
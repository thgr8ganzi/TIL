## RECORD

* 자바 14버전부터 도입 16버전에 정식 스펙으로 채택
* 데이터를 다루기 위한 데이터 클래스로 사용
* 자동으로 생성자를 만들어주고 getter, equals, hashCode, toString 메소드를 만들어준다.
* 필드를 final 로 선언해서 불변 데이터로 관리 할수 있음
```
public record RecordTest(
        String name,
        int age
) {
//    생성자
    public RecordTest {
        if (age < 0) {
            throw new IllegalArgumentException("나이는 0보다 작을 수 없습니다.");
        }
    }
}
```
```
@SpringBootTest
class RecordTestTest {
    @Test
    @DisplayName("Record 객체 생성 테스트")
    public void recordCreate() throws Exception{
        RecordTest recordTest = new RecordTest("John", 20);
        assertThat(recordTest.name()).isEqualTo("John");
        assertThat(recordTest.age()).isEqualTo(20);
        System.out.println(recordTest); // 자동으로 toString() 메서드 적용

        RecordTest recordTest2 = new RecordTest("John", 20);
        assertThat(recordTest).isEqualTo(recordTest2);
    }
}
```
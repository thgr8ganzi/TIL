## SERIALIZE

* Object 또는 Data 를 다른 컴퓨터의서 사용할수 있도록 바이트 스트림 형태로 연속적인 데이터로 변환하는 포맥 변환 기술
* 객체의 상태를 영속화 하는 메커니즘
* 객체를 다른 환경에 저장했다가 다시 복원하게 하는 기술
* 반대 개념인 역직렬화도 있다.

### 사용처

* 어딘가에 저장할때(파일, 데이터, 캐시)
* 다른 JVM 에서 사용할때

### 사용법

```
public interface Serializable {
}

public class SerializedTest implements Serializable {
    public int value;

    public SerializedTest(int value) {
        this.value = value;
    }
}

@SpringBootTest
class SerializedTestTest {
    @Test
    public void serializedTest1() throws Exception{
        byte[] serialized;

//        직렬화
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(baos);

        oos.writeObject(new SerializedTest(1));
        serialized = baos.toByteArray();

        assertThat(serialized).isNotEmpty();

//        역 직렬화
        SerializedTest deserialized = (SerializedTest) new ObjectInputStream(
                    new ByteArrayInputStream(serialized)
            ).readObject();
        assertThat(deserialized.value).isEqualTo(1);
    }
}
```

### 잘 안쓰는 이유

* 보안
* 유지보수
* 테스트

### 대처법

```
// 보안문제
public class PositiveNumber implements Serializable {
    public int value;

    public PositiveNumber(int value) {
        checkPositive(value);
        this.value = value;
    }
    private void checkPositive(int value) {
        if (value < 0) {
            throw new IllegalArgumentException("음수는 사용할 수 없습니다.");
        }
    }
    @Serial
    private void readObject(ObjectInputStream objectInputStream) throws java.io.IOException, ClassNotFoundException {
//        바이트 코드 조작시 valida 시행
        objectInputStream.defaultReadObject();
        checkPositive(value);
    }
}

// 싱글톤 문제
public class SerialSingleton implements Serializable {
    @Getter
    private static final SerialSingleton instance = new SerialSingleton(new Object());
//    직렬화 역직렬화 대상에서 제외
    private final transient Object serializableObject;

    private SerialSingleton(Object o) {
        this.serializableObject = o;
    }

//    readObject 이후 직렬화된 객체를 반환
    @Serial
    private Object readResolve() {
        return instance;
    }
}

// 커스텀 직렬화v(프록시 패턴)
public class SerialPositiveNumber implements Serializable {
    public final int value;

    public SerialPositiveNumber(int value) {
        checkPositive(value);
        this.value = value;
    }
    private void checkPositive(int value) {
        if (value < 0) {
            throw new IllegalArgumentException("음수는 사용할 수 없습니다.");
        }
    }
    @Serial
    private Object writeReplace() {
        return new PositiveNumberProxy(value);
    }

    private static class PositiveNumberProxy implements Serializable {
        private final int value;

        public PositiveNumberProxy(int value) {
            this.value = value;
        }
        private Object readResolve() {
            return new SerialPositiveNumber(value);
        }
    }
}
```
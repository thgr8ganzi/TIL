## Optional

* 자바 8에서 추가된 null 을 안전하게 체크하기 위한 기능
* NullPointException 을 방지하기 위한 방법
* 제네릭 T 타입 클래스의 wrapper 클래스로 null 을 포함한 모든 객체를 저장할수 있다.
* Null 을 직접적으로 다루는것을 위험하기 때문에 간접적을 다룰수 있음
* Null 체크시 코드가 지저분하기 때문에 Optional 을 사용하면 코드가 깔끔해짐
* <a href="https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html">문서</a>

### Optional 객체 생성 

```
//        Optional 객체 생성
        String str = "Hello, World!";
        Optional<String> opt = Optional.of(str);
```
* static 메소드 of 를사용하여 null 이 아닌 객체를 담을수 있다.

### Optional 초기화

```
//        Optional 초기화
        Optional<String> emptyStrNotGood = null; // 바람직 하지 않음 
        Optional<String> emptyStr = Optional.<String>empty();
```

### Optional 가져오기

```
//        객체 값 가져오기
        String str1 = opt.get(); // opt 에 저장된 값 가져오기 null 이면 NoSuchElementException 발생
        String str2 = opt.orElse(""); // opt 에 저장된 값 가져오기 null 이면 "" 반환
        String str3 = opt.orElseGet(String::new); // opt 에 저장된 값 가져오기 null 이면 "" 반환
        String str4 = opt.orElseGet(() -> new String("")); // opt 에 저장된 값 가져오기 null 이면 "" 반환
        String str5 = opt.orElseThrow(NullPointerException::new); // opt 에 저장된 값 가져오기 null 이면 NullPointerException 발생
```

### Optional 로 작업

```
if (Optional.ofNullable(str).isPresent()) {
            // ofNullable() : null 이 아닌 경우 주어진 값을 설명하는 Optional 을 반환하고, 그렇지 않으면 빈 Optional 을 반환합니다.
            // isPresent() : 값이 존재하면 true, 아니면 false
            System.out.println(str);
        }
        Optional.ofNullable(str).ifPresent(System.out::println); // nul 이 아닐때만 작업수행 null 이면 아무작업 안함
```

### OptionalInt, OptionalLong, OptionalDouble

* 기본형 클래스를 감싼 wrapper 클래스
* Optional 클래스보다 더 효율적으로 사용할수 있다.
* Optional 클래스는 모든 변수를 객체로 다루기 때문에 성능이 느리다
```
        OptionalInt optInt1 = OptionalInt.of(0);
        OptionalInt optInt2 = OptionalInt.empty();
        int int1 = optInt1.getAsInt(); // optInt 에 저장된 값 가져오기 0 이면 NoSuchElementException 발생
        System.out.println(optInt1.isPresent()); // true
        System.out.println(optInt2.isPresent()); // false
        System.out.println(optInt1.equals(optInt2)); // false
```

### flatMap, map

```
        Optional<String> optional1 = Optional.of("Hello");
        Optional<Optional<String>> result1 = optional1.map(s -> Optional.of(s + " World"));
        Optional<String> optional2 = Optional.of("Hello");
        Optional<String> result2 = optional2.flatMap(s -> Optional.of(s + " World"));
        System.out.println(result1.get().get());
        System.out.println(result2.get());
```
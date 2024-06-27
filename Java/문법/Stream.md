
## STREAM

* Stream 은 자바8 부터 등장한 했으며 스트림 API 로 데이터 컬렉션 처리를 더욱 간결하고 효율적으로 만들어준다
* Stream 은 순차 및 병렬 집계 작업을 지원하는 일련의 요소입니다.
* 람다를 활용해 배열과 컬렉션을 함수형으로 간단하게 처리할수 있는 기술이다.
* 컴파일러 최적화가 아직 완벽하지 못하여 for-loop 가 더 빠르다.
* 원시타입 순회할경우 for-loop 가 빠르나 복잡한 계산이나 순회비용보다 계산비용이 클경우 Stream 이 더 빠르다.
* 병렬스트림을 처리 할경우 순차스트림보다 빠를수 있으나 LinkedList 의 경우 색인이 어려워 병렬처리 비용이 증가하므로 느릴수도 있다.
* 병렬스트림을 처리할경우 동기화 문제에 신경써야함
* 병렬스트림은 shared state 가 있는데 연산중 다른 스레드에서 접근할경우 문제가 발생할수 있으므로 개발자가 처리해야한다.
* stateless stream 과 stateful stream 이 있는데 distinct, forEach, collect 등은 stateful 이고 ordering 시 성능 체감이 어렵다.

### 특징

* 원본 데이터 소스를 변경하지 않음
* 한번 사용하면 닫혀서 재사용 불가
* 최종연산 전까지 중간 연산을 수행하지 않음(Lazy evaluation)
* 병렬처리 가능
* 기본형 스트림을 제공하여 IntStream 과 같이 오토박싱과 언박싱등 불필요한 과정 생략

### 스트림 생성

```
public static void main(String[] args) {
    String[] strArr = new String[] { "a", "b", "c", "d", "e" };
    List<String> strings = Arrays.asList("a", "b", "c", "d", "e");
//    배열
    Stream<String> strStream1 = Stream.of(strArr);
    Stream<String> strStream2 = Arrays.stream(strArr);
//    컬렉션
    Stream<String> strStream3 = strings.stream();
//    빌더
    Stream<String> strStream4 = Stream.<String>builder()
            .add("a")
            .add("b")
            .add("c")
            .build();
//    람다, iterate
    Stream<String> strStream5 = Stream.generate(() -> "a");
}
```

### 중간 연산

```
//        조건이 true 일경우만 연산
        strings.stream()
                .filter(list -> list.contains("a"));

//        스트림내 요소들 특정값 변환
        strings.stream()
                .map(String::toUpperCase);

//        정렬
        strings.stream()
                .sorted() // 오름차순
                .sorted(Comparator.reverseOrder()) // 내림차순
                .forEach(System.out::println);
//        기타연산
        strings.stream()
                .distinct() // 중복제거
                .limit(3) // 갯수 제한
                .skip(2) // 앞에서 n개 건너뛰기.
                .peek(System.out::println); // 중간처리 결과 확인
```

### 최종연산

```
//        최종연산
        strings.stream()
                .count(); // 요소 갯수
        strings.stream()
                .allMatch(s -> s.length() == 1); // 모든 요소가 조건에 맞는지
        strings.stream()
                .anyMatch(s -> s.length() == 1); // 하나라도 조건에 맞는지
        strings.stream()
                .noneMatch(s -> s.length() == 1); // 모든 요소가 조건에 맞지 않는지
        strings.stream()
                .findFirst(); // 첫번째 요소
        strings.stream()
                .findAny(); // 아무 요소
        strings.stream()
                .reduce((s1, s2) -> s1 + s2); // 요소들을 하나로 합침
        strings.stream()
                .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append); // 요소들을 하나로 합침
```

### collect

```
//        collect
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList()); // 리스트 반환
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.joining("", "", "")); // 작업결과 이어 붙이기 delimiter, prefix, suffix 순서
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toMap(s -> s, String::length)); // map 으로 변환
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.groupingBy(String::length)); // 그룹 지어서 map 으로 변환
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.partitioningBy(s -> s.length() == 1)); // 조건에 따라 분류
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toSet()); // set 으로 변환
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toConcurrentMap(s -> s, String::length)); // concurrentMap 으로 변환
        strings.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toConcurrentMap(s -> s, String::length, (s1, s2) -> s1)); // concurrentMap 으로 변환
```
# uonet-sdk
Nieoficjalne SDK do e-dziennika UONET+ napisane w Node.js.

# Instalacja
Upewnij się, że na Twoim komputerze jest Node.js zainstalowane, a następnie uruchom poniższą komendę:
```bash
$ npm install uonet-sdk
```

# Przykład
```javascript
const { UONET } = require('uonet-sdk');

const uonet = new UONET();

uonet.login('pin', 'token', 'symbol');

uonet.getTimetable(uonet.accounts[0].id, '2018-02-23', '2018-02-23').then((timetable) => {
  console.log(timetable);
});
```

# Dokumentacja
Aby uzyskać jakiekolwiek dane z e-dziennika UONET+, należy dokonać autoryzacji i otrzymać certyfikat, aby później wykonywać żądania np. o plan lekcji.

## Klasa `UONET`
### `new UONET()`

#### Właściwości
`accounts` Account[] - przechowywane są dane o zarejestrowanych kontach

#### Metody
`request(accountId: number, body: object, method: string)` - wykonuje żądanie do UONET+ z podanymi danymi o koncie, treści i metody.
- `accountId` number - ID konta, z którego ma zostać wykonane żądanie
- `body` object - treść żądania
- `method` string - ostatnia część URL żądania np:
  - `PlanLekcjiZeZmianami`
  - `Slowniki`

Zwraca obiekt - wynik żądania.

`getTimetable(accountId: number, from: string, to: string)` - zwraca plan lekcji w danym okresie.
- `from` string - data początkowa w formacie rrrr-mm-dd
- `to` string - data końcowa w formacie rrrr-mm-dd

Zwraca [Lesson](#lesson)[]

`login(pin: string, token: string, symbol: string)` - rejestruje urządzenie i zwraca potrzebne dane o koncie do dalszch żądań.

Zwraca [Account](#account).

## `Lesson`
Obiekt przechowujący dane o danej lekcji w planie.
- `date` object
  - `start` Date - data rozpoczęcia lekcji
  - `end` Date - data zakończenia lekcji
- `order` number - numer lekcji (kolejność)
- `name` string - nazwa przedmiotu
- `room` string - sala
- `teacher` object - nauczyciel
  - `firstName` string - imię nauczyciela
  - `lastName` string - nazwisko nauczyciela
- `note` string - notatka o lekcji (np. "Uczniowie zwolnieni")
- `isForPupil` boolean - określa czy dana lekcja dotyczy ucznia.

## `Account`
Obiekt przechowujący dane o koncie.
- `id` number - ID konta
- `branchId` number - numer oddziału
- `periodId` number - ID okresu klasyfikacyjnego
- `baseURL` string - bazowy adres REST API
- `certificate` [Certificate](#certificate) - dane o certyfikacie konta

## `Certificate`
Obiekt przechowujący dane o certyfikacie.
- `key` string - klucz certyfikatu
- `pfx` string - PFX certyfikatu

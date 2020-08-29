# EventComponent

このプラグイン単体では何も起きません。

主にすでにjavascriptが分かる人のお手助けプラグインです。
このプラグインを使うと、イベントに対して新しい機能を手っ取り早く追加することができます。

EventComponentTemplate.js
```
class EventComponentTemplate extends EventComponent
{
    // componentが持つ変数
	_someInitField;
	_someNonInitField;
	
    // <タグ>で初期値が指定できる変数名
	static get initVariables() {
		return ["_someInitField"];
	}
	
	start() {
		// 開始時に呼ばれる
	}
	
	update() {
		// 毎フレーム呼ばれる
	}
}
```

EventComponentの機能は非常にシンプルです。
マップがロードされる時にstartが呼ばれ、毎フレームupdateが呼ばれます。

ほぼこれだけです。

## メリット

何故
### 簡潔で記述できる

今まで新機能を追加するときに、基本的にupdate関数をオーバーライドして使いますが、記述が非常に長いです。

しかし、Game_Eventに限って言えば、EventComponentを使うと新しい挙動を追加したい時には一行update関数を作るだけです。

### 最適化：機能は必要なイベントにだけ

既存の手法で機能を追加するには、基本的に基底クラスの関数をオーバーライドして処理を追加します。

例え一部のイベントにしか適用したくないときにも、すべてのイベントに同機能を追加する必要があります。関数を汚しているし、コールスタックもだんだん長くなります

これに対して、EventComponent は、必要な処理を「特定のイベントにだけ」追加することが出来ます。本当にこの機能が必要なイベントにだけ適用することにより、不要な処理を省くことができ、ゲームを最適化できます。

## 関数と機能

### 初期化

EventComponentを継承するクラスは、constuctorの記述をオススメしません。
startを使用して初期化ください。

また、static get initVariables() でフィールドの名前を返すと、該当フィールドをタグで初期化できます。タグで記述された初期化フィールドは、startに入る前に初期化されます。

<EC:TestComponent, 1, true>
```
class TestComponent extends EventComponent
{
	_number;
	_bool;
	
	static get initVariables() {
		return ["_number", "_bool"];
	}
	
	start() {
		// この時点で、_numberに1、_boolにtrueが入っています
	}
}
```

このように、同じComponentでも、ツクールエディターから初期値を指定できて、バリエーションを増やせます。

### イベント

いくつか既定の関数がデフォルトで入っています。これらの関数は特定のタイミングに呼び出されます。
| 関数名 | 呼び出しタイミング |
----|---- 
| start | Game_Mapの準備が終わった時 |
| update | 毎フレーム |
| onLoadFromSaveContents | セーブデータからロードされた時 |

今後イベントの数を増やしていく予定です。

### コルーチン (Coroutine)

EventComponentにはコルーチンという機能があります。

updateは毎フレームの処理を記述するに対して、コルーチンはフレームを跨いだ処理を記述できます。

例えば、ゲーム開始1秒後に何かしらの処理を入れて、更に2秒に別の何かしらの処理を入れたいと思う時に、updateで記述すると結構大変になります。

しかし、EventComponentのコルーチンを使用すると、以下のようにとても簡単に記述できます。

```
start() {
    // startCoroutine で開始したいコルチーンを指定する
    this.startCoroutine(myCoroutine());
}

// コルーチンの頭に * をつける
* myCoroutine() {
    // 何かしらの処理...
    yield WaitForSeconds(1.0); // yield で待つ時間を指定する
    // 別の何かしらの処理...
    yield WaitForSeconds(2.0);
    // 更に別のなにかしらの処理...
}
```

## 歴史
EventComponent は私が考えたものではありません。

実は、EventComponentの骨組みは Componentパターンと呼ばれる先人の知恵です。Componentパターンの中心思想は、ゲームの移動、描画、AIなど各部分の処理を Component に分けて分離するという考えです。また、副次的効果として、機能の付け外しが簡単になります。

EventComponent は、大手ゲームエンジン Unity が実装した基底クラス MonoBehaviour から着想を得て実装しました。
import { _decorator, Component, EditBox, Node, Label, UITransform, Color, ScrollView, RichText } from 'cc';
import { Network } from './Network';
const { ccclass, property } = _decorator;

@ccclass('Universe')
export class Universe extends Component {
    private _nextReconnectTime: number = 0; 
    start() {
    }

    update(deltaTime: number) {
        const inputBoxNode = this.node.getChildByName("InputBox");
        const editBoxComponent = inputBoxNode.getComponent(EditBox);
        if (!editBoxComponent.isFocused()) {
            editBoxComponent.focus();
        }
        let network = Network.getInstance();
        if (network.isUnconnect()) {
            let timestampInSeconds = Math.floor(new Date().getTime() / 1000);
            if (timestampInSeconds >= this._nextReconnectTime) {
                if (this._nextReconnectTime != 0) {
                    console.log("断线重连, timestamp:" + timestampInSeconds);
                }
                this._nextReconnectTime = timestampInSeconds + 5;
                this.connectToServer();
            }
        }
    }
    
    connectToServer() {
        let network = Network.getInstance();
        network.connect("ws://47.100.239.124:9948", function() {
            console.log("连接到服务器成功")
            network.on("onOpen", this.onOpen.bind(this));
            network.on("s2c_chat_list", this.onS2cChatList.bind(this));
            network.on("s2c_chat_send", this.onS2cChatSend.bind(this));
        }.bind(this));
    }

    onEditingReturn(editbox : EditBox, customEventData) {
        const content = editbox.string;
        editbox.string = "";
        
        let data = { content: content };
        let network = Network.getInstance();
        network.send("c2s_chat_send", data);

    }

    addContentToMsgBox(content) {
        const chatBoxNode = this.node.getChildByName("ChatBox");
        const viewNode = chatBoxNode.getChildByName("view");
        const contentNode = viewNode.getChildByName("content");

        //let labelNode = new Node('nameItem');
        //contentNode.addChild(labelNode);
        //let labelComponent = labelNode.addComponent(Label);
        //labelComponent.color = new Color(0, 255, 0, 255);
        //labelComponent.string = content;
        //labelComponent.horizontalAlign = Label.HorizontalAlign.CENTER;
        //labelComponent.verticalAlign = Label.VerticalAlign.CENTER;
        //labelComponent.fontSize = 16;
        //labelComponent.lineHeight = 20;
        //labelComponent.updateRenderData();
        //let transformComponent = labelNode.getComponent(UITransform);
        //let labelHeight = transformComponent.height;

        let source = content.match(/^\d+.\d+.\d+.\d+:\d+ 说: /);
        content = content.replace(source, "<color=#1F1AB2>" + source + "</color>");
        
        let richTextNode = new Node('contentItem');
        contentNode.addChild(richTextNode);
        let transformComponent = richTextNode.addComponent(UITransform);
        let richTextComponent = richTextNode.addComponent(RichText);
        richTextComponent.string = content;
        richTextComponent.horizontalAlign = RichText.HorizontalAlign.LEFT;
        richTextComponent.verticalAlign = RichText.VerticalAlign.TOP;
        richTextComponent.fontSize = 10;
        richTextComponent.fontColor = new Color(0, 255, 0, 255);
        richTextComponent.lineHeight = 10;
        richTextComponent.maxWidth = 300;
        let richTextHeight = transformComponent.height;

        transformComponent = contentNode.getComponent(UITransform);
        if (contentNode.children.length == 1) {
            transformComponent.height = richTextHeight;
        } else {
            transformComponent.height += richTextHeight;
        }

        let scrollViewComponent = chatBoxNode.getComponent(ScrollView);
        scrollViewComponent.scrollToBottom(0.1);
    }

    onOpen(event: Event) {
        let network = Network.getInstance();
        network.send("c2s_chat_list", {});
    }

    onS2cChatList(data) {
        const chatBoxNode = this.node.getChildByName("ChatBox");
        const viewNode = chatBoxNode.getChildByName("view");
        const contentNode = viewNode.getChildByName("content");
        contentNode.removeAllChildren();
        let contents = data.contents;
        for (let i = 0; i < contents.length; ++i) {
            this.addContentToMsgBox(contents[i]);
        }
    }

    onS2cChatSend(data) {
        let content = data.content;
        this.addContentToMsgBox(content)
    }
    
}


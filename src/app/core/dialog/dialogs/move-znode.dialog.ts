import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material"
import {MoveZNodeData} from "./move-znode.data";

@Component({
  selector: "zoo-move-znode.dialog",
  templateUrl: "move-znode.dialog.html",
  styleUrls: ["dialog.scss"]
})
export class MoveZNodeDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: MoveZNodeData) {
  }
}

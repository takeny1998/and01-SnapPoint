package com.boostcampwm2023.snappoint.presentation.createpost

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.databinding.BindingAdapter
import androidx.recyclerview.widget.RecyclerView
import com.boostcampwm2023.snappoint.databinding.ItemImageBlockBinding
import com.boostcampwm2023.snappoint.databinding.ItemTextBlockBinding

class CreatePostListAdapter(
    private val listener: (Int, String) -> Unit
) : RecyclerView.Adapter<BlockItemViewHolder>() {

    private var blocks: MutableList<PostBlockState> = mutableListOf()

    fun getCurrentBlocks() = blocks.toList()

    fun updateBlocks(newBlocks: List<PostBlockState>) {
        blocks = newBlocks.toMutableList()
    }

    override fun getItemViewType(position: Int): Int {
        return when(blocks[position]) {
            is PostBlockState.STRING -> ViewType.STRING.ordinal
            is PostBlockState.IMAGE -> ViewType.IMAGE.ordinal
            is PostBlockState.VIDEO -> ViewType.VIDEO.ordinal
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BlockItemViewHolder {
        val inflater = LayoutInflater.from(parent.context)

        when (viewType) {
            ViewType.IMAGE.ordinal -> {
                return BlockItemViewHolder.ImageBlockViewHolder(
                    ItemImageBlockBinding.inflate(inflater, parent, false),
                    listener
                )
            }

            ViewType.VIDEO.ordinal -> {
                TODO()
            }
        }
        return BlockItemViewHolder.TextBlockViewHolder(
            ItemTextBlockBinding.inflate(inflater, parent, false),
            listener
        )
    }

    override fun getItemCount(): Int {
        return blocks.size
    }

    override fun onBindViewHolder(holder: BlockItemViewHolder, position: Int) {
        when (holder) {
            is BlockItemViewHolder.TextBlockViewHolder -> holder.bind(blocks[position].content, position)
            is BlockItemViewHolder.ImageBlockViewHolder -> holder.bind(blocks[position].content, (blocks[position] as PostBlockState.IMAGE).uri, position)
        }
    }

    override fun onViewAttachedToWindow(holder: BlockItemViewHolder) {
        super.onViewAttachedToWindow(holder)
        holder.attachTextWatcherToEditText()
    }

    override fun onViewDetachedFromWindow(holder: BlockItemViewHolder) {
        super.onViewDetachedFromWindow(holder)
        holder.detachTextWatcherFromEditText()
    }

    companion object{
        enum class ViewType {
            STRING,
            IMAGE,
            VIDEO,
        }
    }
}

@BindingAdapter("blocks", "listener")
fun RecyclerView.bindRecyclerViewAdapter(blocks: List<PostBlockState>, listener: (Int, String) -> Unit) {
    if (adapter == null) adapter = CreatePostListAdapter(listener)

    when {
        // 아이템 추가
        (adapter as CreatePostListAdapter).getCurrentBlocks().size < blocks.size -> {
            with(adapter as CreatePostListAdapter) {
                updateBlocks(blocks)
                notifyItemInserted(blocks.size - 1)
            }
        }

        // content 변경
        (adapter as CreatePostListAdapter).getCurrentBlocks().size == blocks.size -> {
            with(adapter as CreatePostListAdapter) {
                updateBlocks(blocks)
            }
        }
    }
}
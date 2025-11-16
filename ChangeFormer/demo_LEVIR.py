from argparse import ArgumentParser

import utils
import torch
from models.basic_model import CDEvaluator

import os

"""
quick start

sample files in ./samples

save prediction files in the ./samples/predict

"""


def get_args():
    # ------------
    # args
    # ------------
    parser = ArgumentParser()
    parser.add_argument('--project_name', default='CD_ChangeFormerV6_LEVIR_b16_lr0.0001_adamw_train_test_200_linear_ce_multi_train_True_multi_infer_False_shuffle_AB_False_embed_dim_256', type=str)
    parser.add_argument('--gpu_ids', type=str, default='0', help='gpu ids: e.g. 0  0,1,2, 0,2. use -1 for CPU')
    parser.add_argument('--checkpoint_root', default='/media/lidan/ssd2/ChangeFormer/checkpoints/', type=str)
    parser.add_argument('--output_folder', default='samples_LEVIR/predict_CD_ChangeFormerV6', type=str)

    # data
    parser.add_argument('--num_workers', default=0, type=int)
    parser.add_argument('--dataset', default='CDDataset', type=str)
    parser.add_argument('--data_name', default='quick_start_LEVIR', type=str)

    parser.add_argument('--batch_size', default=1, type=int)
    parser.add_argument('--split', default="demo", type=str)
    parser.add_argument('--img_size', default=256, type=int)

    # model
    parser.add_argument('--n_class', default=2, type=int)
    parser.add_argument('--embed_dim', default=256, type=int)
    parser.add_argument('--net_G', default='ChangeFormerV6', type=str,
                        help='ChangeFormerV6 | CD_SiamUnet_diff | SiamUnet_conc | Unet | DTCDSCN | base_resnet18 | base_transformer_pos_s4_dd8 | base_transformer_pos_s4_dd8_dedim8|')
    parser.add_argument('--checkpoint_name', default='best_ckpt.pt', type=str)

    args = parser.parse_args()
    return args


if __name__ == '__main__':

    args = get_args()
    utils.get_device(args)
    device = torch.device("cuda:%s" % args.gpu_ids[0]
                          if torch.cuda.is_available() and len(args.gpu_ids)>0
                        else "cpu")
    args.checkpoint_dir = os.path.join(args.checkpoint_root, args.project_name)
    # Auto-discover fallback in repo 'checkpoints' if the default checkpoint root isn't present
    repo_ckpt_dir = os.path.join(os.path.dirname(__file__), 'checkpoints', args.project_name)
    preferred_ckpt_path = os.path.join(args.checkpoint_dir, args.checkpoint_name)
    if not os.path.exists(preferred_ckpt_path):
        alt_ckpt_path = os.path.join(repo_ckpt_dir, args.checkpoint_name)
        if os.path.exists(alt_ckpt_path):
            args.checkpoint_dir = os.path.join(os.path.dirname(__file__), 'checkpoints')
            print(f"Using local repo checkpoint path: {args.checkpoint_dir}")
        else:
            # last resort: try to find any matching checkpoint existing in ./checkpoints/<project> or any project
            possible_match = None
            base_checkpoints = os.path.join(os.path.dirname(__file__), 'checkpoints')
            if os.path.isdir(base_checkpoints):
                for root, dirs, files in os.walk(base_checkpoints):
                    for f in files:
                        if f == args.checkpoint_name or f.endswith('.pt'):
                            possible_match = os.path.join(root, f)
                            break
                    if possible_match:
                        break
            if possible_match:
                args.checkpoint_dir = os.path.dirname(possible_match)
                args.project_name = os.path.basename(args.checkpoint_dir)
                print(f"Found checkpoint at {possible_match}; using checkpoint_dir={args.checkpoint_dir}")
    os.makedirs(args.output_folder, exist_ok=True)

    log_path = os.path.join(args.output_folder, 'log_vis.txt')

    data_loader = utils.get_loader(args.data_name, img_size=args.img_size,
                                   batch_size=args.batch_size,
                                   split=args.split, is_train=False)

    model = CDEvaluator(args)
    model.load_checkpoint(args.checkpoint_name)
    model.eval()

    for i, batch in enumerate(data_loader):
        name = batch['name']
        print('process: %s' % name)
        score_map = model._forward_pass(batch)
        model._save_predictions()







